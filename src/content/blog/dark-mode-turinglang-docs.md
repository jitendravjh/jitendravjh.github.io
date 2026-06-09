---
title: 'Bringing Dark Mode to TuringLang Docs'
description: 'Adding a theme switcher with auto-detection to TuringLang''s documentation — the no-flash trick, system preference, and remembering the user''s choice.'
pubDate: '2025-04-08'
authors:
  - jitendra-verma
toc: true
tags:
  - open-source
  - web
  - css
---

Documentation sites are read in bright offices and dark bedrooms alike, so a good theme toggle matters. For [TuringLang](https://turinglang.org), I added a theme switcher with three properties: it respects the system preference, remembers the user's explicit choice, and — crucially — doesn't flash the wrong theme on load.

## The flash-of-wrong-theme problem

If you decide the theme inside a normal script or a framework component, the page first paints in the default theme and *then* corrects itself. That flash is jarring. The fix is to run a tiny **blocking inline script** in the `<head>`, before the browser paints anything:

```html
<script>
  (() => {
    const saved = localStorage.getItem('theme');
    const system = matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved ?? (system ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  })();
</script>
```

<div class="callout" data-callout="note">
  <p><strong>Why inline and blocking?</strong> It must run synchronously before first paint. An external or deferred script is too late — the flash already happened.</p>
</div>

## Theming with CSS variables

Everything visual reads from custom properties, so switching themes is just swapping a single attribute on `<html>`:

```css
:root {
  --bg: #ffffff;
  --text: #1a1a1a;
}
[data-theme='dark'] {
  --bg: #1a1a1a;
  --text: #f1f1f1;
}
body {
  background: var(--bg);
  color: var(--text);
}
```

## Remembering the choice

The toggle flips the attribute and persists the decision so it survives reloads and navigation:

```js
function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const next = isDark ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
}
```

<div class="callout" data-callout="tip">
  <p><strong>Bonus:</strong> the very site you're reading uses the same no-flash pattern. Try the toggle in the header.</p>
</div>

## What shipped

- A theme switch with light, dark, and system-auto behaviour.
- The no-flash inline script so there's no theme flicker on first load.
- A readability and contrast pass on the dark palette.

Small feature, outsized quality-of-life improvement — and a great first issue if you're looking to contribute to a docs site.
