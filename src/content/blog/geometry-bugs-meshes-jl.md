---
title: 'Three Geometry Bugs in Meshes.jl'
description: 'A polygon that meshed to NaN, a grid query that always came back empty, and an intersection that recursed until the stack ran out. Three fixes in JuliaGeometry/Meshes.jl.'
pubDate: '2026-08-24'
authors:
  - jitendra-verma
toc: true
tags:
  - open-source
  - julia
  - geometry
---

[Meshes.jl](https://github.com/JuliaGeometry/Meshes.jl) is the computational geometry library underneath most of the Julia geospatial stack. Three of its open issues turned out to have the same shape: a case the code never expected, reached by input that is perfectly ordinary.

## A polygon that meshed to NaN

To triangulate a polygon with a hole, you cut a bridge from the outer ring to the inner one, turning it into a single ring that a standard algorithm can handle.

The bridge is built from the segment between a vertex A on the outside and a vertex B on the hole. What happens when the outer ring and the hole **share a vertex**? Then A equals B, the segment has zero length, and the offset computation becomes infinity times zero. The mesh comes out with `NaN` vertices.

The fix orients the bridge towards the hole rather than along a segment that does not exist:

```julia
v = A == B ? (coordmean(inner) - A) : (B - A)
```

There is a second half to it. The usual construction inserts two pairs of split points, but with a zero-length bridge those points coincide and come back as zero-area triangles, so a single pair is enough.

The issue thread suggested routing around it with `Repair(10)`, which expands a polygon's outer rings. That does clear the `NaN`, but it moves the outer ring by ten times the tolerance, so the vertices you put in are no longer the vertices you get out. For a meshing library that is a bad trade.

<div class="callout" data-callout="note">
  <p>Verified against <code>measure(poly)</code> over a sweep of hole sizes, corners and scales, 64 cases in total: no NaN and no area mismatch. One zero-area triangle survives at the pinch point, which is unavoidable, because that shared vertex has to appear twice in the bridged ring.</p>
</div>

## A grid query that was always empty

`cartesianrange` finds which elements of a grid fall inside a bounding box. On geodesic grids it returned an empty range every single time, which made `Slice` throw for any geodesic grid at all.

The cause is a one-word assumption. `_geodesicrange` read the first grid dimension as longitude. But `LatLon` grids are ordered **(lat, lon)**, so it was intersecting the latitude axis against the longitude interval, and the two rarely overlap.

The tempting fix is to swap the two. The better fix is to stop assuming, because both orderings genuinely exist in the wild:

```julia
latfirst = abs(v₂.lat - v₁.lat) > abs(v₂.lon - v₁.lon)
```

The axis that varies along the first grid direction is the one that direction represents. That works for either convention, and for descending axes.

I checked it against the Euclidean range computed on the same grid in (lat, lon) space, over **1100 random boxes** across regular and rectilinear grids, including the decreasing-axis case. No mismatches. This code path had no tests before, which is presumably how it shipped returning nothing.

## An intersection that ran out of stack

`Line` had no `Box` method. Julia dutifully fell back to the symmetric case, which called the original, which fell back again. Not a wrong answer: a stack overflow.

`Ray` and `Box` already had a working implementation using the slab method, which clips the parameter interval against each pair of opposite faces in turn. A line is the same computation with one change. A ray starts at its origin, so its parameter is bounded below at zero. A line extends both ways:

```julia
tmin = typemin(T)   # a ray would use zero(T)
```

`intersects` needed its method pair too, for the same reason.

## The pattern

None of these is an exotic input. A polygon whose hole touches its boundary, a grid in the ordering the type already documents, a line and a box. They survived because each one sits just outside the shape of the tests.

<div class="callout" data-callout="tip">
  <p><strong>Lesson learned:</strong> when a function assumes an ordering, detecting it costs one comparison and removes a whole class of bug. Assumptions that are cheap to verify should be verified, not documented.</p>
</div>

The [bridge fix](https://github.com/JuliaGeometry/Meshes.jl/pull/1419) and the [geodesic range fix](https://github.com/JuliaGeometry/Meshes.jl/pull/1421) are merged; the [line and box intersection](https://github.com/JuliaGeometry/Meshes.jl/pull/1423) is open.
