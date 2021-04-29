const appConfig = require("@/config.json");
const ThumborUrlBuilder = require("thumbor-url-builder");

const getImageURL = (path, imgWidth = 0, imgHeight = 0, imgQuality = 60) => {
  const thumborURL = new ThumborUrlBuilder(
    process.env.VUE_APP_THUMBOR_KEY,
    appConfig.image.server
  );

  const url = thumborURL
    .setImagePath(path)
    .resize(imgWidth, imgHeight)
    .filter(`quality(${imgQuality})`)
    .smartCrop(true)
    .buildUrl();

  return url;
};

export { getImageURL };
