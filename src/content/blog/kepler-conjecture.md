---
title: 'The Kepler Conjecture'
description: 'No arrangement of equal spheres fills more than π/√18 of space. Kepler asserted it in 1611 without argument; it took until 1998 to prove and 2014 to check by machine.'
pubDate: '2026-08-26'
authors:
  - jitendra-verma
tags:
  - open-source
  - julia
  - mathematics
externalUrl: 'https://jitendravjh.in/julia-notebooks/kepler-conjecture.html'
source: 'Pluto notebook'
---

In 1611 Kepler wrote a short essay on why snowflakes have six corners, and remarked in passing
that no arrangement of equal spheres packs more tightly than the way fruit is stacked on a
market stall. He offered no argument. Nobody else managed one for three hundred and eighty-seven
years.

Hales announced a proof in 1998. It appeared in the Annals in 2005 with the referees reporting
they were ninety-nine per cent certain but unable to verify the computations in full, and Hales
responded by formalising the entire argument. The Flyspeck project finished a proof checked end
to end by HOL Light and Isabelle in August 2014.

The notebook computes what the conjecture is actually about: the densities of the candidate
packings, the rhombic dodecahedron that forms the Voronoi cell around each sphere, and the
twelve neighbours that Newton and Gregory argued over in 1694. Then it shows why the obvious
approach fails. The natural strategy is local, bounding the cell around any one sphere, and it
cannot work, because a regular dodecahedron with the same inradius is smaller than the rhombic
one. A single sphere can sit in a cell filling 0.7547 of its volume, comfortably above Kepler's
0.7405. Locally the bound is simply false, and ruling out every partial imitation of that
configuration is what made the problem hard.
