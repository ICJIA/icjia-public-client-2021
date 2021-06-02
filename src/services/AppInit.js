import config from "@/config.json";
import hub from "@/hub.json";
const computedPublicPath =
  process.env.NODE_ENV === `production` ? config.publicPath : "";

let myApp = {
  config,
  hub,
  computedPublicPath,
};

export { myApp };
