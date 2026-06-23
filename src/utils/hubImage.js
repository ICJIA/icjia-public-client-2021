// Research hub card images are pre-generated at build time by
// generators/generateImagesHub.js, which decodes each Strapi base64 splash/
// image and writes it under its ORIGINAL extension (e.g. `${id}-splash.png`
// for a PNG upload, `${id}-splash.jpeg` for a JPEG). The card consumers,
// however, build the URL with a single hard-coded extension, so a card whose
// source image is the other format 404s and falls back to the default
// placeholder.
//
// splashCandidates() turns one hard-coded URL into an ordered list of URLs to
// try: the original extension first (existing, working images are unchanged
// and incur no extra request), then the alternate format. The card walks this
// list on image-load error before surrendering to the placeholder.

const ALT_EXT = { png: "jpeg", jpeg: "png", jpg: "png" };

function splashCandidates(imagePath) {
  if (!imagePath) return [];

  const match = imagePath.match(/^(.*)\.(jpe?g|png)$/i);
  if (!match) return [imagePath];

  const base = match[1];
  const ext = match[2].toLowerCase();
  const alt = ALT_EXT[ext];

  const urls = [`${base}.${ext}`];
  if (alt && alt !== ext) urls.push(`${base}.${alt}`);
  return urls;
}

export { splashCandidates };
