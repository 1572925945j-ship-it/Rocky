const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const portfolioRoot = path.join(root, "static", "portfolio");
const generatedRoot = path.join(portfolioRoot, "generated");
const sourceDirs = ["pdf_render", "custom", "profile"];
const widths = [480, 768, 1280, 1920, 2560];
const imageExtensions = new Set([".jpg", ".jpeg", ".png"]);

const toPosix = (value) => value.split(path.sep).join("/");
const toUrl = (relativePath) => `/static/portfolio/${toPosix(relativePath)}`;
const toGeneratedUrl = (relativePath) => `/static/portfolio/generated/${toPosix(relativePath)}`;

const slugify = (relativePath) =>
  toPosix(relativePath)
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

const hashFile = async (filePath) => {
  const buffer = await fs.promises.readFile(filePath);
  return crypto.createHash("sha1").update(buffer).digest("hex").slice(0, 10);
};

const listImages = async (dir) => {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const filePath = path.join(dir, entry.name);
      if (entry.isDirectory()) return listImages(filePath);
      if (!imageExtensions.has(path.extname(entry.name).toLowerCase())) return [];
      return [filePath];
    })
  );
  return files.flat();
};

const getTargetWidths = (sourceWidth) => {
  const targets = widths.filter((width) => width <= sourceWidth);
  return targets.length ? targets : [sourceWidth];
};

const createPlaceholder = async (sourcePath) => {
  const buffer = await sharp(sourcePath, { limitInputPixels: false })
    .rotate()
    .resize({ width: 32, withoutEnlargement: true })
    .blur(1.2)
    .webp({ quality: 36 })
    .toBuffer();
  return `data:image/webp;base64,${buffer.toString("base64")}`;
};

const variantSrcSet = (variants) => variants.map((variant) => `${variant.src} ${variant.width}w`).join(", ");

const writeVariant = async ({ sourcePath, baseName, format, width }) => {
  const extension = format === "jpeg" ? "jpg" : format;
  const filename = `${baseName}-${width}.${extension}`;
  const outputPath = path.join(generatedRoot, filename);
  const pipeline = sharp(sourcePath, { limitInputPixels: false })
    .rotate()
    .resize({
      width,
      withoutEnlargement: true,
      fit: "inside",
    });

  if (format === "avif") {
    pipeline.avif({ quality: 85, effort: width >= 2560 ? 0 : 4 });
  } else if (format === "webp") {
    pipeline.webp({ quality: 90, effort: 6 });
  } else {
    pipeline.flatten({ background: "#ffffff" }).jpeg({ quality: 92, mozjpeg: true });
  }

  const result = await pipeline.toFile(outputPath);
  return {
    src: toGeneratedUrl(filename),
    width: result.width,
    height: result.height,
    bytes: result.size,
  };
};

const buildImageEntry = async (sourcePath) => {
  const relativePath = toPosix(path.relative(portfolioRoot, sourcePath));
  const metadata = await sharp(sourcePath, { limitInputPixels: false }).rotate().metadata();
  const sourceWidth = metadata.width || 0;
  const sourceHeight = metadata.height || 0;
  const targets = getTargetWidths(sourceWidth);
  const hash = await hashFile(sourcePath);
  const baseName = `${slugify(relativePath)}.${hash}`;

  const avif = [];
  const webp = [];
  const jpeg = [];

  for (const width of targets) {
    avif.push(await writeVariant({ sourcePath, baseName, format: "avif", width }));
    webp.push(await writeVariant({ sourcePath, baseName, format: "webp", width }));
    jpeg.push(await writeVariant({ sourcePath, baseName, format: "jpeg", width }));
  }

  const stage = webp.find((variant) => variant.width >= 1280) || webp[webp.length - 1];
  const placeholder = await createPlaceholder(sourcePath);

  return {
    key: relativePath,
    value: {
      src: toUrl(relativePath),
      width: sourceWidth,
      height: sourceHeight,
      aspectRatio: sourceWidth && sourceHeight ? sourceWidth / sourceHeight : 1,
      placeholder,
      stage,
      fallback: {
        src: toUrl(relativePath),
        width: sourceWidth,
        height: sourceHeight,
      },
      avif,
      webp,
      jpeg,
      avifSrcSet: variantSrcSet(avif),
      webpSrcSet: variantSrcSet(webp),
      jpegSrcSet: variantSrcSet(jpeg),
    },
  };
};

const main = async () => {
  await fs.promises.rm(generatedRoot, { recursive: true, force: true });
  await fs.promises.mkdir(generatedRoot, { recursive: true });

  const sourceFiles = (
    await Promise.all(
      sourceDirs.map((dirName) => {
        const dir = path.join(portfolioRoot, dirName);
        return fs.existsSync(dir) ? listImages(dir) : [];
      })
    )
  )
    .flat()
    .sort((a, b) => toPosix(a).localeCompare(toPosix(b)));

  const images = {};
  let totalBytes = 0;

  for (const sourcePath of sourceFiles) {
    const entry = await buildImageEntry(sourcePath);
    images[entry.key] = entry.value;
    totalBytes += [...entry.value.avif, ...entry.value.webp, ...entry.value.jpeg].reduce((sum, variant) => sum + variant.bytes, 0);
    console.log(`generated ${entry.key}`);
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    sourceRoot: "/static/portfolio",
    widths,
    formats: ["avif", "webp", "jpeg"],
    imageCount: Object.keys(images).length,
    totalGeneratedBytes: totalBytes,
    images,
  };
  const runtimeImages = Object.fromEntries(
    Object.entries(images).map(([key, value]) => {
      const { placeholder, ...runtimeValue } = value;
      return [key, runtimeValue];
    })
  );
  const runtimeManifest = {
    generatedAt: manifest.generatedAt,
    sourceRoot: manifest.sourceRoot,
    widths: manifest.widths,
    formats: manifest.formats,
    imageCount: manifest.imageCount,
    images: runtimeImages,
  };

  await fs.promises.writeFile(path.join(generatedRoot, "image-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  await fs.promises.writeFile(path.join(generatedRoot, "runtime-image-manifest.json"), `${JSON.stringify(runtimeManifest, null, 2)}\n`);
  console.log(`portfolio image manifest generated for ${manifest.imageCount} images`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
