# jitendravjh.github.io

My personal portfolio, built with [Astro](https://astro.build) and hosted on GitHub Pages. Keeps the look of my original static site (Comfortaa, the `#FFD523` yellow accent, light/dark toggle) on top of a modern Astro setup.

## Live Site

https://jitendravjh.github.io/

## Features

- Light/dark theme with a no-flash inline theme script (defaults to light, remembers your choice)
- Blog with Markdown/MDX, callouts, code highlighting, LaTeX math, table of contents, tags, and an archive
- **External post redirection** — posts published elsewhere (e.g. GeeksforGeeks) link out instead of rendering a local page
- Projects page driven by `src/data/projects.json`
- Auto-generated Open Graph images for every page and post
- Full-text search via [Pagefind](https://pagefind.app/)
- RSS feed, sitemap, and `robots.txt`
- GitHub Actions deploy to GitHub Pages

## Commands

| Command           | Action                                       |
| :---------------- | :------------------------------------------- |
| `npm install`     | Install dependencies                         |
| `npm run dev`     | Start local dev server at `localhost:4321`   |
| `npm run build`   | Build production site to `./dist/` (also runs Pagefind) |
| `npm run preview` | Preview the production build locally         |

## Customisation

- `src/consts.ts` — site title, intro text, social links, contact email, resume link
- `src/data/projects.json` — projects shown on the Projects page
- `src/data/authors.json` — author profile
- `src/content/blog/*.md` — blog posts

### Adding an external (e.g. GeeksforGeeks) post

Create a Markdown file in `src/content/blog/` and add `externalUrl` (and optionally `source`) to the frontmatter:

```yaml
---
title: 'How to Install Homebrew on macOS'
description: 'A step-by-step guide.'
pubDate: '2024-03-15'
source: 'GeeksforGeeks'
externalUrl: 'https://www.geeksforgeeks.org/how-to-install-homebrew-on-macos/'
tags: ['macos', 'tooling']
---
```

The post then appears in all listings but links straight to `externalUrl` in a new tab; no local page is generated. The example URLs in this repo point to GeeksforGeeks — swap them for your own article URLs.

## Deployment

Pushes to `main` trigger `.github/workflows/website-deploy.yml`, which builds the site and deploys `dist/` to the `gh-pages` branch.

## Contact

Email: [jitendravjh@gmail.com](mailto:jitendravjh@gmail.com)
