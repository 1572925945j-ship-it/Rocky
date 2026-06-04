require("dotenv").config({ path: "../../.env" });
import express from "express";
import fs from "fs";
import path from "path";
import Routes from "../Routing/Routes";
import { GetMeta } from "../Routing/Metadata";
import GetPage from "../../src/_document";
import { Metadata } from "../../Config/Default";

const PORT = process.env.PORT || 3000;

const app = express();
const setStaticCacheHeaders = (res, filePath) => {
  if (/\.(?:js|css)$/.test(filePath)) {
    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
  } else if (/portfolio[\/\\]generated[\/\\].+\.(?:avif|webp|jpe?g)$/i.test(filePath)) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  } else if (/\.(?:avif|webp|jpe?g|png|gif|svg|ico)$/i.test(filePath)) {
    res.setHeader("Cache-Control", "public, max-age=604800");
  }
};
const publicDir = path.resolve(__dirname, "public");
const getAssetVersion = (() => {
  let version = "";
  return () => {
    if (version) return version;
    try {
      const jsMtime = fs.statSync(path.join(publicDir, "main.js")).mtimeMs;
      const cssMtime = fs.statSync(path.join(publicDir, "main.js.css")).mtimeMs;
      version = Math.max(jsMtime, cssMtime).toString(36).replace(".", "");
    } catch (_error) {
      version = "dev";
    }
    return version;
  };
})();

// Have Node serve the files for our built React app
app.use(express.static(path.resolve(__dirname, "../../dist/public"), { setHeaders: setStaticCacheHeaders }));

app.use(express.json({ extended: false }));

let root = false;
for (const [key, value] of Object.entries(Routes)) {
  if (key === "/") root = true;
  app.get(key, async (_req, res) => {
    const Config = await value.Init();
    const html = page(Config, key);
    res.send(html);
  });
}
app.get("/sw.js", function (req, res) {
  //send the correct headers
  res.header("Content-Type", "text/javascript");

  res.sendFile(path.join(__dirname, "sw.js"));
});

if (!root) {
  app.get("/", (_req, res) => {
    res.send(Tutoriel());
  });
}

app.use("/static", express.static(publicDir, { setHeaders: setStaticCacheHeaders }));

app.listen(PORT,() => console.log(`Server is running in port http://localhost:${PORT}`));
const PWA = `<script>if ('serviceWorker' in navigator) {window.addEventListener('load', function() {navigator.serviceWorker.register('/sw.js').then(function(registration) {console.log('ServiceWorker registration successful with scope: ', registration.scope);}, function(err) {console.log('ServiceWorker registration failed: ', err);});});}</script>`;
const page = (Config, key) => {
  const assetVersion = getAssetVersion();
  const pageConfig = {
    ...Config,
    Metadata: {
      ...Config.Metadata,
      assetVersion,
    },
  };
  return `
    <!DOCTYPE html>
    <html lang="en">
      ${GetPage(pageConfig, key)}
     <style>
        #SSRSEO{
          opacity:0;
        }
      </style>
      <noscript>Please enable JavaScript to view this website</noscript>
      <script>
        window.__INITIAL__DATA__ = ${JSON.stringify(pageConfig.Data)};
      </script>
        ${PWA}
      <script defer src="/static/main.js?v=${assetVersion}"></script>
    </html>
  `;
};
const Tutoriel = () => {
  return `
    <!DOCTYPE html>
    <html lang="en">
      ${GetMeta(Metadata)}
      <body>
      <div class="Tutoriel_INIT">
       <h1>Regis Grumberg F-Framwork</h1>
       <ul>
        <li>npm run dev</li>
        <li>Create a directory in the Views directory that will create a view</li>
        <li>Change the url of your view in the Config.js in the variable Route</li>
        <li>Create a with data-root in it to create transition between page</li>
       </ul>
       </div>
      </body>
      <script>
      window.addEventListener('load',()=>{
        if("serviceWorker" in navigator){
          navigator.serviceWorker.register("/static/sw.js");
        }
      })
      </script>
      <noscript>Please enable JavaScript to view this website</noscript>
     <script defer src="/static/main.js?v=${getAssetVersion()}"></script>
    </html>
  `;
};
