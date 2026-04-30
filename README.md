# Panda

Create polished, shareable code images with React 19, Vite+, Ant Design, and CodeMirror.

## Overview

Panda turns source code into presentation-ready visuals for social posts, docs, cover images, and talks. The app combines:

- syntax-highlighted code editing
- theme and window chrome presets
- background image and gradient styling
- watermark and branding controls
- export flows for image-first sharing

The current online preview is available at [https://pandajs404.github.io/panda-image](https://pandajs404.github.io/panda-image).

## Requirements

- Node.js `>=20.19.0`
- pnpm `10.33.0`

The repository is pinned with `"packageManager": "pnpm@10.33.0"`.

## Quick Start

Preferred Vite+ workflow:

```bash
vp install
vp dev
```

Script aliases remain available for teammates who prefer package-manager scripts:

```bash
pnpm install
pnpm dev
```

## Common Commands

```bash
vp dev
vp check
vp build
vp preview
```

Equivalent script aliases:

```bash
pnpm dev
pnpm lint
pnpm build
pnpm preview
```

## DevTools Analysis

Vite DevTools is wired in as an opt-in analysis path and stays off during normal development and CI.

```bash
pnpm analyze
```

This runs:

```bash
cross-env VITE_DEVTOOLS=true vp build
```

Use it only when you want build analysis output.

## Formatting And Checks

Static checks now run through Vite+ (`vp check`) with Oxfmt/Oxlint and type-aware analysis.

Current formatting behavior keeps the previous project conventions:

- `singleQuote: true`
- `semi: false`
- `printWidth: 100`
- `arrowParens: 'avoid'`

## Environment Variables

Panda keeps the existing runtime environment contract:

| Variable                | Purpose                                                              |
| ----------------------- | -------------------------------------------------------------------- |
| `VITE_BASE_PATH`        | Override the deployed base path, used by GitHub Pages builds.        |
| `VITE_API_URL`          | API origin used by the frontend.                                     |
| `NEXT_PUBLIC_API_URL`   | Next-style alias for the API origin.                                 |
| `VITE_API_PROXY_TARGET` | Local `/api` proxy target during development.                        |
| `VITE_SITE_URL`         | Absolute site URL for generated metadata and asset links.            |
| `NEXT_PUBLIC_SITE_URL`  | Next-style alias for the site URL.                                   |
| `VITE_DEVTOOLS`         | Enables the optional Vite DevTools analysis path when set to `true`. |

## CI

GitHub Pages deployment now uses:

- `voidzero-dev/setup-vp@v1`
- `vp install --frozen-lockfile`
- `vp check`
- `vp build`

## Notes

- `prettier` remains installed because Panda loads `prettier/standalone` at runtime inside the app's formatting feature.
- `@reach/visually-hidden` and `react-helmet-async` still emit React 19 peer dependency warnings during install, but the app builds successfully.
- `pnpm-lock.yaml` is now the source-of-truth lockfile for the repository.
