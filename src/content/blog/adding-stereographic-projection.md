---
title: 'Adding a Map Projection, and Getting It Reviewed'
description: 'Implementing the Stereographic projection for CoordRefSystems.jl from Snyder and PROJ, then a review conversation about which parameter a projection should actually be typed on.'
pubDate: '2026-08-26'
authors:
  - jitendra-verma
toc: true
tags:
  - open-source
  - julia
  - geospatial
---

After fixing a run of round-trip bugs in [CoordRefSystems.jl](https://github.com/JuliaEarth/CoordRefSystems.jl), the natural next step was to add something rather than repair it. Stereographic was missing, and it is a projection worth having: conformal, used for every polar dataset in existence, and the basis of the Dutch national grid.

## One type, four aspects

Stereographic is really a family. Put the projection centre at the north pole, the south pole, on the equator, or anywhere else, and you get four aspects that look nothing alike but share a formula.

The implementation covers all four, in both elliptical and spherical mode, as a single type:

```julia
Stereographic{Mode,k₀,latₒ,Datum,Shift}
```

The polar and oblique branches need different formulas, so the branch is chosen once inside `formulas` rather than tested per point.

## Verifying against two independent references

A projection is easy to write and hard to be sure about. I checked the implementation two ways.

First against [PROJ](https://proj.org), the reference implementation the whole geospatial world uses, for all four aspects. Worst relative deviation: **4e-16**, which is floating-point noise rather than disagreement.

Second against Snyder's *Map Projections: A Working Manual*, which carries worked numerical examples precisely so implementers can check themselves. The oblique case matches his worked example.

<div class="callout" data-callout="tip">
  <p><strong>Two references, not one.</strong> PROJ tells you whether you agree with everyone else. Snyder tells you whether you agree with the mathematics. They can disagree, and when they do you want to know.</p>
</div>

## The review question

Registering the EPSG codes for the polar datasets came next: EPSG:3031 for Antarctica, EPSG:3995 for the Arctic, EPSG:3413 for NSIDC sea ice. That is where the interesting conversation happened.

EPSG defines those three by a **latitude of true scale**, the parallel along which the map is exactly to scale. The type above is parameterised by $k_0$, the scale factor. So my registrations contained lines like this:

```julia
Stereographic{EllipticalMode,0.9727690128917972,-90°,WGS84Latest}
```

The maintainer asked the obvious question: if EPSG prioritises the latitude, why is the type parameterised on the scale factor?

It is a fair question, and the library genuinely uses both conventions elsewhere. `EqualAreaCylindrical` is typed on a latitude of true scale; `TransverseMercator` is typed on a scale factor. So "we always use $k_0$" would have been the wrong answer.

The real answer is that latitude of true scale only means anything in the **polar** aspect. For an oblique stereographic there is no standard parallel, only a scale factor at the origin, and PROJ agrees: its `+lat_ts` applies only when `+lat_0` is ±90. Since one type covers all four aspects, $k_0$ is the only parameter defined for all of them.

Worth adding: the conversion runs one way only in practice. Sweeping the latitude of true scale from 0 to 90 gives $k_0$ between 0.5025 and 1, so a scale factor above 1 has no real latitude of true scale at all.

## The fix that was better than the answer

Being right about the parameter did not make the hardcoded float any nicer to read. The maintainer suggested mirroring an existing helper, `utm`, which turns a zone and hemisphere into the awkward parameters `TransverseMercator` actually wants.

So the registrations now read:

```julia
@crscodes stereosouth(71.0°) EPSG{3031}
@crscodes stereonorth(70.0°, lonₒ=-45.0°) EPSG{3413}
@crscodes stereonorth(71.0°) EPSG{3995}
```

with `stereo`, `stereonorth` and `stereosouth` doing the Snyder conversion internally. The magic constant is gone, and the explanation now lives beside the code that performs it rather than in a comment beside a number, where it cannot drift.

There was an unexpected bonus. The computed value turned out to be **more accurate than the constant it replaced**. Against a 240-bit reference, the old hardcoded figure was 2.2 units in the last place off; the computed one is 0.8. Doing the arithmetic at load time beats pasting in a number somebody once printed.

## What I would tell myself before the first PR

The review was the most useful part. I went in thinking the question was "is this correct", and correct it was, verified to 4e-16. The question that actually mattered was "is this the right shape for the people who will use it", and that is not something a test suite can answer for you.

Both the [EPSG registrations](https://github.com/JuliaEarth/CoordRefSystems.jl/pull/369) and an [Oblique Stereographic](https://github.com/JuliaEarth/CoordRefSystems.jl/pull/370) implementation, the variant that projects through a Gauss conformal sphere, are open at the time of writing. The [base projection](https://github.com/JuliaEarth/CoordRefSystems.jl/pull/367) is merged.
