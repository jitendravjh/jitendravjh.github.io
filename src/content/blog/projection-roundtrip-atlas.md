---
title: 'A Round-Trip Atlas for Map Projections'
description: 'Measuring how far every map projection in CoordRefSystems.jl drifts when you project a point and convert it back, drawn as a map. Where a projection fails turns out to say exactly how it is implemented.'
pubDate: '2026-08-24'
authors:
  - jitendra-verma
tags:
  - open-source
  - julia
  - geospatial
externalUrl: 'https://jitendravjh.in/geo-notebooks/roundtrip-atlas.html'
source: 'Pluto notebook'
---

A Pluto notebook that measures the round-trip accuracy of every map projection in
CoordRefSystems.jl, at every point on the globe, and draws the result as a map.

Most projections are exact to a few nanometres. Two are not, and the atlas shows not just
that they fail but where: Robinson's error falls in horizontal bands sitting on the five
degree spacing of its lookup table, and TransverseMercator's falls in two discs on the
equator where the projection is singular.
