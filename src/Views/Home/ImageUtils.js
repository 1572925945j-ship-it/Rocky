import React from "react";
import imageManifest from "../../../static/portfolio/generated/runtime-image-manifest.json";

const portfolioPrefix = "/static/portfolio/";
const rockyPortfolioPrefix = "/Rocky/static/portfolio/";

export const getSiteBasePath = () => {
  if (typeof window === "undefined") return "";
  const explicitBase = window.__ROCKY_ASSET_BASE__;
  if (typeof explicitBase === "string") return explicitBase.replace(/\/$/, "");
  return window.location.pathname === "/Rocky" || window.location.pathname.startsWith("/Rocky/") ? "/Rocky" : "";
};

export const resolveAssetUrl = (url) => {
  if (!url || /^(data:|blob:|https?:\/\/)/.test(url)) return url || "";
  if (url.startsWith("/Rocky/")) return url;
  if (url.startsWith("/static/")) return `${getSiteBasePath()}${url}`;
  return url;
};

export const getPortfolioKey = (src = "") => {
  const cleanSrc = String(src).split("?")[0].split("#")[0];
  if (cleanSrc.startsWith(rockyPortfolioPrefix)) return cleanSrc.slice(rockyPortfolioPrefix.length);
  if (cleanSrc.startsWith(portfolioPrefix)) return cleanSrc.slice(portfolioPrefix.length);
  if (cleanSrc.startsWith("portfolio/")) return cleanSrc.slice("portfolio/".length);
  return cleanSrc.replace(/^\/+/, "");
};

export const getImageEntry = (src) => {
  const key = getPortfolioKey(src);
  return imageManifest.images?.[key] || null;
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const pickVariants = (entry, format, maxWidth) => {
  const variants = entry?.[format] || [];
  if (!maxWidth) return variants;
  const filtered = variants.filter((variant) => variant.width <= maxWidth);
  return filtered.length ? filtered : variants.slice(0, 1);
};

export const buildSrcSet = (entry, format, maxWidth) =>
  pickVariants(entry, format, maxWidth)
    .map((variant) => `${resolveAssetUrl(variant.src)} ${variant.width}w`)
    .join(", ");

export const getStageImage = (imageOrSrc) => {
  const src = typeof imageOrSrc === "string" ? imageOrSrc : imageOrSrc?.src || imageOrSrc?.image || "";
  const entry = getImageEntry(src);
  const stage = entry?.stage;
  return {
    src: resolveAssetUrl(stage?.src || src),
    width: stage?.width || entry?.width,
    height: stage?.height || entry?.height,
    entry,
  };
};

export const getFullImage = (imageOrSrc) => {
  const src = typeof imageOrSrc === "string" ? imageOrSrc : imageOrSrc?.src || imageOrSrc?.image || "";
  const entry = getImageEntry(src);
  return {
    src: resolveAssetUrl(entry?.fallback?.src || src),
    width: entry?.fallback?.width || entry?.width,
    height: entry?.fallback?.height || entry?.height,
    entry,
  };
};

export const OptimizedImage = ({
  src,
  alt = "",
  className = "",
  loading = "lazy",
  decoding = "async",
  draggable = false,
  fetchPriority,
  sizes = "100vw",
  maxWidth,
  useStageFallback = false,
}) => {
  const entry = getImageEntry(src);
  const fallback = useStageFallback ? getStageImage(src) : getFullImage(src);
  const imgProps = {
    src: fallback.src,
    alt,
    loading,
    decoding,
    draggable,
  };

  if (className) imgProps.className = className;
  if (fallback.width) imgProps.width = fallback.width;
  if (fallback.height) imgProps.height = fallback.height;
  if (sizes) imgProps.sizes = sizes;
  if (fetchPriority) imgProps.fetchPriority = fetchPriority;

  if (!entry) return <img {...imgProps} />;

  const avifSrcSet = buildSrcSet(entry, "avif", maxWidth);
  const webpSrcSet = buildSrcSet(entry, "webp", maxWidth);
  const jpegSrcSet = buildSrcSet(entry, "jpeg", maxWidth);
  if (jpegSrcSet) imgProps.srcSet = jpegSrcSet;

  return (
    <picture>
      {avifSrcSet ? <source type="image/avif" srcSet={avifSrcSet} sizes={sizes} /> : null}
      {webpSrcSet ? <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} /> : null}
      <img {...imgProps} />
    </picture>
  );
};

const attrsToHtml = (attrs) =>
  Object.entries(attrs)
    .filter(([, value]) => value !== undefined && value !== null && value !== false && value !== "")
    .map(([key, value]) => (value === true ? key : `${key}="${escapeHtml(value)}"`))
    .join(" ");

export const createOptimizedImageHTML = (src, alt = "", options = {}) => {
  const {
    className,
    loading = "lazy",
    decoding = "async",
    draggable = "false",
    fetchPriority,
    sizes = "100vw",
    maxWidth,
    useStageFallback = false,
  } = options;
  const entry = getImageEntry(src);
  const fallback = useStageFallback ? getStageImage(src) : getFullImage(src);
  const imgAttrs = {
    class: className,
    src: fallback.src,
    alt,
    loading,
    decoding,
    draggable,
    width: fallback.width,
    height: fallback.height,
    sizes,
    fetchpriority: fetchPriority,
  };

  if (!entry) return `<img ${attrsToHtml(imgAttrs)} />`;

  const avifSrcSet = buildSrcSet(entry, "avif", maxWidth);
  const webpSrcSet = buildSrcSet(entry, "webp", maxWidth);
  const jpegSrcSet = buildSrcSet(entry, "jpeg", maxWidth);
  if (jpegSrcSet) imgAttrs.srcset = jpegSrcSet;

  const sources = [
    avifSrcSet ? `<source type="image/avif" srcset="${escapeHtml(avifSrcSet)}" sizes="${escapeHtml(sizes)}" />` : "",
    webpSrcSet ? `<source type="image/webp" srcset="${escapeHtml(webpSrcSet)}" sizes="${escapeHtml(sizes)}" />` : "",
  ].join("");

  return `<picture>${sources}<img ${attrsToHtml(imgAttrs)} /></picture>`;
};
