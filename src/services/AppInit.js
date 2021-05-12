import config from "@/config.json";

const computedPublicPath =
  process.env.NODE_ENV === `production` ? config.publicPath : "";

let myApp = {
  config,
  computedPublicPath,
};

export { myApp };
