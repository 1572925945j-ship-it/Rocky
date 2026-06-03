# GitHub Upload Checklist

## Upload This Project Folder

Use this folder as the repository root:

```text
rocky-portfolio-github-package 2
```

## Required Content

Make sure these are present before uploading:

```text
Config/
GlobalStyles/
dist/
lib/
src/
static/
package.json
package-lock.json
README.md
AI_HANDOFF.md
AI_EDITING_GUIDE.md
vercel.json
```

## Do Not Upload

These are ignored by `.gitignore`:

```text
node_modules/
.DS_Store
*.zip
```

## Local Test

After downloading/cloning from GitHub:

```bash
npm install
npm run build
npm start
```

Then open:

```text
http://localhost:3000/
```

## Deployment Notes

- `dist/` is already included, so the current built site is packaged.
- `static/portfolio/custom/` contains all manually replaced project images.
- If another AI edits this project, start with `AI_HANDOFF.md` and `AI_EDITING_GUIDE.md`.
- If image paths are changed, update `src/Views/Home/Data.js` and rebuild.
