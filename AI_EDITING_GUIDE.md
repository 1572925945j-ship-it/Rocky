# Rocky Portfolio Editing Guide

This guide is for future AI assistants or developers editing the portfolio.

## Quick Start

```bash
npm install
npm run build
npm start
```

Open:

```text
http://localhost:3000/
```

For development watch mode:

```bash
npm run dev
```

## Main Edit Points

### Change Project Data Or Image Order

Edit:

```text
src/Views/Home/Data.js
```

Look for the `projects` array. Custom image galleries use `customImages`.

### Change Detail Gallery Layout

Edit:

```text
src/Views/Home/Manager.js
```

Look for:

```text
buildGallery(project)
```

Current special gallery layouts:

- `BUSINESS`: custom cover plus left/right columns.
- `BRAND`: centered full-width image stack.
- `IP DESIGN`: top cover plus two-column gallery.
- `AIGC VISUAL`: top cover plus two-column gallery.

### Change Image Size, Width, Or Responsive Behavior

Edit:

```text
src/Views/Home/Home.scss
```

Important classes:

```text
.GalleryBrand
.GalleryIP
.GalleryOther
.GalleryPairGrid
.GalleryColumns
.GalleryItem.is-fit-full
```

`is-fit-full` means the image keeps its full aspect ratio and is not cropped.

## Replace Images

Put new custom images here:

```text
static/portfolio/custom/
```

Then update the matching path in:

```text
src/Views/Home/Data.js
```

After replacing images:

```bash
npm run build
npm start
```

## Current Custom Image Mapping

### 02 BRAND

```text
brand-section-cover.png
brand-portfolio-layout.png
```

### 03 IP DESIGN

```text
ip-section-cover.png
ip-resource-8.png
ip-resource-7.png
ip-resource-6.png
ip-resource-5.png
ip-resource-4.png
ip-resource-3.png
ip-resource-2.png
```

### 04 OTHER / AIGC VISUAL

```text
other-section-cover.png
other-resource-2.png
other-resource-3.png
other-resource-4.png
other-resource-5.png
other-resource-6.png
other-resource-7.png
other-resource-8.png
```

## Scroll Logic Notes

The project detail chain is:

```text
BUSINESS -> BRAND -> IP DESIGN -> AIGC VISUAL
```

The reverse chain is also implemented. Bottom jumps require a strong scroll push; do not remove the intent/ready timing state in `Manager.js` unless intentionally changing this behavior.

Relevant state/methods in `Manager.js`:

```text
detailProjectSequence
onDetailWheel
onDetailScroll
openNextDetailProject
openPreviousDetailProject
isStrongBottomPush
resetBottomPushIntent
```

## GitHub Notes

Commit/upload everything except:

```text
node_modules/
.DS_Store
*.zip
```

The production build is included in `dist/`, but another machine can rebuild it from source with `npm run build`.
