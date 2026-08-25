---
title: 'The Middle of Nowhere'
description: 'Finding the point in Australia farthest from any town, using a Voronoi diagram instead of a search. It lands in the Great Victoria Desert with three towns tied for nearest.'
pubDate: '2026-08-24'
authors:
  - jitendra-verma
tags:
  - open-source
  - julia
  - geospatial
externalUrl: 'https://jitendravjh.in/julia-notebooks/middle-of-nowhere.html'
source: 'Pluto notebook'
---

What is the point on land farthest from any town? It sounds like a question you answer by
searching the whole map, and it is not. The largest empty circle you can grow on a plane is
always centred on a Voronoi vertex, because only there can it touch three sites at once, and
touching fewer means you can still push it further. That turns a continent into a few hundred
candidates.

Run it on Natural Earth's Australian towns and the answer comes out in the Great Victoria
Desert, 576 kilometres from anywhere. Ceduna, Laverton and Norseman are all at that distance
within two kilometres of each other, which is the theorem showing up in the data: the circle is
resting on all three at once.

Voronoi tessellation from Meshes.jl, projection from CoordRefSystems.jl, data through
GeoArtifacts.jl.
