---
title: 'A Conjecture That Was False'
description: 'The Jacobian conjecture stood since 1939 and broke in July 2026. A Pluto notebook that verifies the counterexample exactly and then shows the geometry that makes it possible.'
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

In 1939 Ott-Heinrich Keller asked whether a polynomial map whose derivative is invertible at
every point must itself be invertible, with a polynomial inverse. Local invertibility in
exchange for global invertibility. It resisted proof and disproof for eighty-seven years.

In July 2026 it broke, though not in the direction anyone expected. Levent Alpöge produced an
explicit polynomial map of three variables whose Jacobian determinant is the constant −2, and
which sends three different points to the same image. The conjecture is false in dimension
three, and therefore in every dimension above it. The two variable case, which is the one
Keller actually asked about, is still open.

The notebook verifies all of this in exact rational arithmetic rather than taking it on trust,
then works through why such a map can exist. Multiplying a linear form by a quadratic form is
three to one, because a cubic has three roots and you get to choose which one goes to the
linear factor. Pushing a grid through a tangent sweep with Meshes.jl shows the same thing as a
picture: the sheet folds along the curve and covers the inside twice.
