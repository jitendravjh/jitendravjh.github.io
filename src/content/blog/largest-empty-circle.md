---
title: 'The Largest Empty Circle'
description: 'Finding the point in Australia farthest from any town by reducing an optimisation over the plane to a search over Voronoi vertices.'
pubDate: '2026-08-24'
authors:
  - jitendra-verma
tags:
  - open-source
  - julia
  - geospatial
externalUrl: 'https://jitendravjh.in/julia-notebooks/largest-empty-circle.html'
source: 'Pluto notebook'
---

Which point is farthest from every member of a finite set of sites? Phrased that way it looks
like an optimisation over a continuum, and it is not one. The largest circle enclosing no site,
with its centre confined to the convex hull, is centred either at a vertex of the Voronoi
diagram or on the hull boundary.

The reason is short enough to give here. Grow a circle about a candidate centre until it meets a
site. Touching one site, the centre can retreat directly away from it and the circle grows;
touching two, it can slide along their bisector; only when three sites are tied is it stuck, and
three equidistant nearest sites is exactly the condition defining a Voronoi vertex.

Run on Natural Earth's Australian towns, this puts the answer in the Great Victoria Desert, 576
kilometres from anywhere. Ceduna, Laverton and Norseman all sit at that distance within two
kilometres of each other, which is the argument above appearing in the data. The notebook uses
Meshes.jl for the tessellation and CoordRefSystems.jl for the projection, and is careful about
the one inconsistency involved: the diagram is planar while the distances are not.
