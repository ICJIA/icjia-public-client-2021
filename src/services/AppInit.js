import config from "@/config/config.json";
// import hub from "@/hub.json";
// import grants from "@/grants.json";
import searchIndex from "@/config/searchIndex.json";
import disclaimers from "@/config/disclaimers.json";
import context from "@/config/contextMenus.json";

// eslint-disable-next-line no-unused-vars
import Fuse from "fuse.js";
const fuse = new Fuse(searchIndex, config.search.site);

// console.log("fuse: ", fuse.options);
let myApp = {
  config,
  context,
  disclaimers,
  fuse,
};

export { myApp };
