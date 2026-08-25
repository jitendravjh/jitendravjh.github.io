---
title: 'The Jacobian Conjecture in Dimension Three'
description: 'A conjecture open since 1939 was refuted in July 2026, for three variables and above. A Pluto notebook that verifies the counterexample in exact arithmetic and accounts for how it works.'
pubDate: '2026-08-25'
authors:
  - jitendra-verma
tags:
  - open-source
  - julia
  - mathematics
externalUrl: 'https://jitendravjh.in/julia-notebooks/jacobian-conjecture.html'
source: 'Pluto notebook'
---

If a polynomial map of complex space has a derivative that is invertible at every point, must
the map itself be invertible, with a polynomial inverse? Ott-Heinrich Keller asked this in 1939
for two variables. It resisted both proof and refutation for eighty-seven years.

In July 2026 it was refuted, though for three variables rather than two. Levent Alpöge gave an
explicit polynomial map of degree seven whose Jacobian determinant is the constant −2, and which
sends three distinct points to a single image. That settles the conjecture negatively in
dimension three and, by adjoining identity coordinates, in every dimension above. The two
variable case Keller actually posed is still open.

The notebook verifies both facts in exact rational arithmetic rather than relying on the
published account, then works through why such a map can exist. Multiplying a linear form by a
quadratic form is generically three to one, since a binary cubic factors that way once for each
of its three roots, and a resultant condition makes the same map locally injective. The
mechanism is visible one dimension down as a tangent sweep, where a grid pushed through the map
with Meshes.jl folds along the curve.
