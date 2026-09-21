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

// A picture card shows the ICJIA default when its record has no picture of its
// own: none at all (no base64 `image` from the CMS and no built file, as on the
// Hub's home page, which gives its cards the CMS record itself), or a built
// file that would not load (`imageOK` false, once the candidates above are
// used up). Text-only cards never show a picture.
function needsDefaultImage({ item, textOnly, imageOK }) {
  if (textOnly || !item) return false;
  if (item.image) return false;
  return !item.imagePath || !imageOK;
}

export { splashCandidates, needsDefaultImage };
