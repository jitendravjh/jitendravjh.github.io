---
title: 'Adaptive Loss Functions for PINNs: My NeuralPDE.jl Contribution'
description: 'Contributing SoftAdapt and ReLoBRaLo adaptive loss weighting to SciML/NeuralPDE.jl - and what adaptive weighting actually does for physics-informed neural networks.'
pubDate: '2024-11-18'
authors:
  - jitendra-verma
toc: true
tags:
  - open-source
  - julia
  - machine-learning
---

One of my favourite open-source contributions was adding two **adaptive loss functions** to [SciML/NeuralPDE.jl](https://github.com/SciML/NeuralPDE.jl): `SoftAdaptAdaptiveLoss` and `ReLOBRaLoAdaptiveLoss`. This post explains the problem they solve and the math behind them.

## The multi-objective problem in PINNs

A physics-informed neural network (PINN) minimises a loss that is really a *sum* of competing terms - the PDE residual, the boundary conditions, and the initial conditions:

$$
\mathcal{L}(\theta) = \lambda_r \mathcal{L}_{r}(\theta) + \lambda_b \mathcal{L}_{b}(\theta) + \lambda_i \mathcal{L}_{i}(\theta)
$$

The trouble is that these terms can differ in scale by orders of magnitude. If $\mathcal{L}_r$ dominates, the network nails the interior equation but drifts on the boundary. Fixed weights $\lambda_k$ rarely balance well across all of training.

<div class="callout" data-callout="info">
  <p><strong>The idea:</strong> instead of fixing the weights, <em>adapt</em> them during training so no single term is allowed to dominate.</p>
</div>

## SoftAdapt

SoftAdapt sets each weight from the recent *rate of change* of its loss term, using a softmax over those rates:

$$
\lambda_k = \frac{\exp\!\left(\beta\, s_k\right)}{\sum_j \exp\!\left(\beta\, s_j\right)}, \qquad s_k = \frac{\mathcal{L}_k^{(n)} - \mathcal{L}_k^{(n-1)}}{\mathcal{L}_k^{(n-1)} + \epsilon}
$$

Terms that are improving slowly get more weight, so the optimiser is nudged toward the components that are lagging.

## ReLoBRaLo

ReLoBRaLo (Relative Loss Balancing with Random Lookback) compares each term to its value at a reference step and mixes in a random lookback to its initial value, which stabilises the balancing:

$$
\hat{\lambda}_k^{(n)} = m\,\hat{\lambda}_k^{(n-1)} + (1 - m)\,\lambda_k^{(n)}
$$

where $m$ is an exponential-moving-average momentum. In NeuralPDE the call site stays clean - you just pass the adaptive loss into the discretization:

```julia
adaptive_loss = ReLOBRaLoAdaptiveLoss(100; α = 0.999, ρ = 0.999)

discretization = PhysicsInformedNN(
    chain, strategy;
    adaptive_loss = adaptive_loss,
)
```

## What changed in the PR

- Implemented `SoftAdaptAdaptiveLoss` and `ReLOBRaLoAdaptiveLoss` against the existing adaptive-loss interface.
- Filled in placeholder docstrings for `PINNRepresentation` and `PhysicsInformedNN` so the API is actually documented.
- Refreshed CI badges in the README.

<div class="callout" data-callout="tip">
  <p><strong>Lesson learned:</strong> reading a mature codebase's existing abstractions before writing code is most of the work. The interface was already there - I just had to fit into it.</p>
</div>

Contributing to SciML taught me more about both Julia and numerical ML than any tutorial could. If you're nervous about a first PR to a big project: start with the docstrings nobody else wants to write.
