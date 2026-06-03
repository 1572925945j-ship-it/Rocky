const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const distPublic = path.join(root, "dist", "public");
const docs = path.join(root, "docs");
const docsStatic = path.join(docs, "static");

const copyDir = (from, to) => {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const source = path.join(from, entry.name);
    const target = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyDir(source, target);
    } else {
      fs.copyFileSync(source, target);
    }
  }
};

const removeDir = (target) => {
  if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true });
};

removeDir(docs);
copyDir(distPublic, docsStatic);

const mainJs = path.join(docsStatic, "main.js");
if (fs.existsSync(mainJs)) {
  const js = fs.readFileSync(mainJs, "utf8").replace(/(["'`])\/static\//g, "$1/Rocky/static/");
  fs.writeFileSync(mainJs, js);
}

const html = `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>靳浩然作品集 | 视觉设计师</title>
    <meta name="keywords" content="靳浩然, 作品集, 视觉设计师, 运营设计师, AIGC" />
    <meta name="author" content="靳浩然" />
    <meta name="description" content="靳浩然视觉设计师作品集，包含商业落地、品牌设计、IP设计、运营视觉和AIGC设计项目。" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="靳浩然作品集 | 视觉设计师" />
    <meta property="og:description" content="靳浩然视觉设计师作品集，包含商业落地、品牌设计、IP设计、运营视觉和AIGC设计项目。" />
    <meta property="og:image" content="/Rocky/static/portfolio/pdf_render/page-01.pdf.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="靳浩然作品集 | 视觉设计师" />
    <meta name="twitter:description" content="靳浩然视觉设计师作品集，包含商业落地、品牌设计、IP设计、运营视觉和AIGC设计项目。" />
    <meta name="twitter:image" content="/Rocky/static/portfolio/pdf_render/page-01.pdf.png" />
    <meta name="theme-color" content="#000000" />
    <link rel="icon" type="image/ico" href="/Rocky/static/Meta/favicon.ico" />
    <link rel="apple-touch-icon" href="/Rocky/static/Meta/apple-touch-icon.png" />
    <link rel="manifest" href="/Rocky/static/site.webmanifest" />
    <link rel="stylesheet" href="/Rocky/static/main.js.css" />
  </head>
  <body>
    <main id="root">
      <section data-key="/">
        <div id="SSRSEO">
          <h1>靳浩然作品集</h1>
          <p>视觉设计师 / 运营设计师 / AIGC WORKFLOW</p>
        </div>
      </section>
    </main>
    <style>#SSRSEO{opacity:0}</style>
    <noscript>Please enable JavaScript to view this website</noscript>
    <script>
      window.__INITIAL__DATA__ = {"name":"靳浩然","role":"视觉设计师 / 运营设计师"};
      window.__ROCKY_PAGES_PATH__ = window.location.pathname;
      if (window.location.pathname !== "/") {
        window.history.replaceState(null, "", "/");
        window.addEventListener("load", function () {
          window.history.replaceState(null, "", window.__ROCKY_PAGES_PATH__ || "/Rocky/");
        });
      }
    </script>
    <script defer src="/Rocky/static/main.js"></script>
  </body>
</html>
`;

fs.writeFileSync(path.join(docs, "index.html"), html);
fs.writeFileSync(path.join(docs, "404.html"), html);
fs.writeFileSync(path.join(docs, ".nojekyll"), "");

console.log("GitHub Pages static site generated in docs/");
