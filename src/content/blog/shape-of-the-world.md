---
title: 'The Shape of the World'
description: 'Every flat map of a round planet is a lie, and Gauss proved you cannot avoid it. A Pluto notebook that morphs the world between projections and uses Tissot indicatrices to show exactly what each one gives up.'
pubDate: '2026-08-25'
authors:
  - jitendra-verma
tags:
  - open-source
  - julia
  - geospatial
externalUrl: 'https://jitendravjh.in/geo-notebooks/shape-of-the-world.html'
source: 'Pluto notebook'
---

You cannot flatten a sphere without tearing or stretching it. That is Gauss's Theorema
Egregium, and it is not a limitation of our cleverness but a fact about curved surfaces. So
every map projection has to give something up, and the only real question is which loss you
are willing to live with.

This notebook makes the tradeoff visible. Real Natural Earth coastlines are projected twice
and blended, so the world morphs continuously from Plate Carrée through Robinson, Winkel
Tripel, Equal Earth and Sinusoidal to Gall-Peters. Then Tissot's indicatrix, small circles
drawn on the globe and projected along with the land, shows what is actually happening to
shape and area at every point.

Mercator keeps every circle a perfect circle and lets them grow without limit toward the
poles. Gall-Peters keeps every circle the same area and squashes them into ellipses. Robinson
keeps neither, on purpose. And the trait table at the end never has a projection that is both
conformal and equal-area, which is Gauss's theorem showing up as a column of `false`.

Built on [CoordRefSystems.jl](https://github.com/JuliaEarth/CoordRefSystems.jl),
[Meshes.jl](https://github.com/JuliaGeometry/Meshes.jl),
[GeoArtifacts.jl](https://github.com/JuliaEarth/GeoArtifacts.jl) and
[Makie.jl](https://docs.makie.org).
