# Rocky Portfolio AI Handoff

This package contains the complete editable portfolio website: source code, static image data, production build output, and notes for future AI/developer edits.

## Project Overview

- React 17 + Webpack creative portfolio website.
- Express serves the production build from `dist/`.
- Local URL after starting: `http://localhost:3000/`.
- Visual style is inspired by the Regis Grumberg reference: loader, scroll-driven 3D cards, detail gallery, and project-to-project scroll transitions.

## Run Locally

```bash
npm install
npm run build
npm start
```

Use Node 16 if possible. The build script already includes `NODE_OPTIONS=--openssl-legacy-provider`.

## Important Files

- `src/Views/Home/Data.js`: portfolio data, project grouping, image paths, custom gallery images.
- `src/Views/Home/Manager.js`: scroll logic, detail-page transitions, project gallery rendering.
- `src/Views/Home/Home.scss`: layout, image sizing, gallery columns, responsive rules.
- `src/Views/Home/index.js`: homepage markup, project cards, contact panel.
- `static/portfolio/custom/`: all newly replaced custom project images.
- `static/portfolio/pdf_render/`: original rendered PDF pages, still kept for completeness.
- `dist/`: latest production build output.

## Current Project Detail Order

The detail pages are chained by scroll:

```text
01 BUSINESS -> 02 BRAND -> 03 IP DESIGN -> 04 AIGC VISUAL / OTHER
```

Reverse scrolling is also supported:

```text
04 -> 03 -> 02 -> 01
```

Bottom transitions intentionally require a stronger scroll push, so normal browsing at the bottom should not jump too easily.

## Current Custom Galleries

### 01 BUSINESS

Uses mixed custom commercial images in `static/portfolio/custom/`:

- `tripcom-business-overview.jpg`
- `lovart-business-overview.jpg`
- `changi-business-overview.png`
- `air-new-zealand-business-overview.png`
- `valvoline-business-overview.png`

Layout is a custom two-column business gallery in `Manager.js` and `Home.scss`.

### 02 BRAND

Old brand PDF pages are removed from the detail gallery. Current images:

- `brand-section-cover.png`
- `brand-portfolio-layout.png`

Both are full-width, complete-display images.

### 03 IP DESIGN

Old IP PDF pages are removed from the detail gallery. Current images:

- Top single cover: `ip-section-cover.png`
- Two-column gallery order: `ip-resource-8.png`, `ip-resource-7.png`, `ip-resource-6.png`, `ip-resource-5.png`, `ip-resource-4.png`, `ip-resource-3.png`, `ip-resource-2.png`

### 04 OTHER / AIGC VISUAL

Old other-design PDF pages are removed from the detail gallery. Current images:

- Top single cover: `other-section-cover.png`
- Two-column gallery order: `other-resource-2.png`, `other-resource-3.png`, `other-resource-4.png`, `other-resource-5.png`, `other-resource-6.png`, `other-resource-7.png`, `other-resource-8.png`

## GitHub Upload Notes

Do not upload `node_modules/`. It is ignored and can be regenerated with:

```bash
npm install
```

Recommended files/folders to upload:

```text
Config/
GlobalStyles/
dist/
lib/
src/
static/
.env
.gitignore
AI_EDITING_GUIDE.md
AI_HANDOFF.md
GITHUB_UPLOAD_CHECKLIST.md
README.md
package.json
package-lock.json
vercel.json
```

The `.env` file currently contains no private token. If future secrets are added, remove them before uploading.
