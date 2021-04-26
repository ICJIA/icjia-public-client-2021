import config from "@/config.json";
// import siteMeta from "../assets/site-meta.json";
// import units from "../assets/units.json";

const computedPublicPath =
  process.env.NODE_ENV === `production` ? config.publicPath : "";

let myApp = {
  config,
  computedPublicPath,
};

export { myApp };
