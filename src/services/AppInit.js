import config from "@/config.json";
import hub from "@/hub.json";
import hubArticles from "@/hubArticles.json";
const computedPublicPath =
  process.env.NODE_ENV === `production` ? config.publicPath : "";

let myApp = {
  config,
  hub,
  hubArticles,
  computedPublicPath,
};

export { myApp };
