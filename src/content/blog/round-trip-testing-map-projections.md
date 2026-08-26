---
title: 'Five Bugs Hiding Behind a Skip List'
description: 'Round-trip testing every map projection in CoordRefSystems.jl over the whole globe, and what the blanket skips in the test suite were quietly covering up.'
pubDate: '2026-08-23'
authors:
  - jitendra-verma
toc: true
tags:
  - open-source
  - julia
  - geospatial
---

Every map projection makes the same quiet promise: take a latitude and longitude, project it, convert it back, and you should land where you started. That is an invariant you can test everywhere, cheaply, without a reference implementation.

[CoordRefSystems.jl](https://github.com/JuliaEarth/CoordRefSystems.jl) already had such a test, in `fwdbwd.jl`. It also had a list of projections it skipped. Those skips turned out to be five real bugs that nobody had filed.

## Measuring the error honestly

The obvious metric is wrong. Comparing latitude and longitude componentwise makes every projection look catastrophic at the poles, because longitude is undefined there. A point at the north pole can come back with any longitude at all and still be the same place.

So measure **great-circle displacement** instead, in metres: how far the recovered point actually landed from where it started. Longitude ambiguity at a pole then contributes nothing, which is correct, and what remains is real error.

## Sinusoidal: a sign flip at the pole

Sinusoidal collapses each pole to a single point, so the inverse computes `x / cos(ϕ)`, which is 0/0 there. Worse, `cos` is hypersensitive near ±π/2: a shift of 2e-16 in ϕ flips its sign.

The result was that a round trip starting at longitude 45° came back at **-17°**. Not a small error, a completely different meridian, produced by dividing two numbers that were both essentially zero.

The fix is to return zero at the poles, matching guards that already existed in `Orthographic` and `LambertAzimuthal`:

```julia
λ = abs(cosϕ) < atol(x) ? zero(x) : x / cosϕ
```

Zero is not more "correct" than -17° in any deep sense, since longitude genuinely is undefined at a pole. It is just the canonical answer, and a canonical answer is what a round trip needs.

## EqualAreaCylindrical: a DomainError on 28 datums

This one is the reason I now distrust test suites that only exercise WGS84.

The inverse used a raw `asin(q / qₚ)` with an inlined copy of `qₚ`. At latitude -90 that ratio rounds just past 1 on many ellipsoids, and `asin` throws a `DomainError`. Not a wrong answer, a crash.

<div class="callout" data-callout="warning">
  <p><strong>28 of the 46 datums</strong> in the library were affected, including NAD83, ITRF, ETRF and OSGB36. WGS84 happens to land just inside the valid range, so the existing tests never saw it.</p>
</div>

The library already had `authqₚ` and `geod2auth` helpers that clamp properly, used by `EqualEarth` and `LambertAzimuthal`. The fix was to stop hand-rolling the computation and call them. I checked the result against Snyder's worked example for the ellipsoid: qₚ comes out 1.9954814 and the projected coordinates match to the millimetre.

Three separate issues were open against this, for latitudes of true scale at 45°, 30° and 0°. They are the same projection with a different parameter, so one fix closed all three.

## LambertAzimuthal: cancellation near the antipode

This is the one worth reading closely, because the bug is not in the logic at all. The formula was correct. It was just written in a way that destroys precision.

The denominator was

$$1 + \sin\beta_0 \sin\beta + \cos\beta_0 \cos\beta \cos\lambda$$

Look at what that quantity is. It is $1 + \cos c$, where $c$ is the angular distance between the point and the projection centre. Near the antipode $c \to 180°$, so $\cos c \to -1$, and you are computing `1 + (-0.9999...)`. Every leading digit cancels.

Using $\cos\lambda = 2\cos^2(\lambda/2) - 1$ and $\cos(\beta + \beta_0) = \cos\beta\cos\beta_0 - \sin\beta\sin\beta_0$, the same expression becomes

$$2\left(\sin^2\!\left(\frac{\beta + \beta_0}{2}\right) + \cos\beta_0 \cos\beta \cos^2\!\left(\frac{\lambda}{2}\right)\right)$$

Identical value, but now it is a **sum of non-negative terms**. Nothing cancels. This is the same trick the haversine formula uses for the same reason.

```julia
_laeaBden(βₒ, β, cosβₒ, cosβ, λ) =
  2 * (sin((β + βₒ) / 2)^2 + (cosβₒ * cosβ) * cos(λ / 2)^2)
```

It had been inlined in three places, so it now lives in one helper.

In Float32 the worst round-trip error dropped from **1.0° to 0.0197°**, and the mean from 4.7e-4 to 1.0e-4. Float64 is unchanged, because Float64 had enough digits to absorb the cancellation. That is exactly why nobody noticed.

## Orthographic: stepping away from a correct answer

`Orthographic` inverts numerically through `projinv`. At the limb, the edge of the visible hemisphere, the Jacobian determinant collapses to about 1e-17. The solver was handed a seed that was already exact, then took a step that made things worse, and landed on a negative latitude.

The fix is unglamorous: reject steps that do not reduce the deviation.

## Replacing skips with reasons

The point of all this was to delete the blanket skips. What is left is a handful of narrow ones, each with a stated reason:

- At the poles, longitude is undefined. `LambertConic` already skipped for this.
- At the limb of `Orthographic`, only half the digits of the latitude survive, so the error is $\sqrt{\epsilon}$.
- Near the antipode of `LambertAzimuthal`, the amplification factor is $2/\cos(c/2)$, about 229 at one degree out, so Float32 still misses a few points.

Each of those is a property of the mathematics, not of the code. The old skips were a property of the code.

<div class="callout" data-callout="tip">
  <p><strong>Lesson learned:</strong> a skip in a test suite is a bug report nobody filed. If you cannot write down why a case is excluded in terms of the maths, it is excluded because it fails.</p>
</div>

All five fixes are merged: [#362](https://github.com/JuliaEarth/CoordRefSystems.jl/pull/362), [#363](https://github.com/JuliaEarth/CoordRefSystems.jl/pull/363), [#364](https://github.com/JuliaEarth/CoordRefSystems.jl/pull/364), [#365](https://github.com/JuliaEarth/CoordRefSystems.jl/pull/365) and [#366](https://github.com/JuliaEarth/CoordRefSystems.jl/pull/366).
