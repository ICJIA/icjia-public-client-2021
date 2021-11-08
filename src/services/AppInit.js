import config from "@/config/config.json";
import disclaimers from "@/config/disclaimers.json";
import context from "@/config/contextMenus.json";
import menus from "@/config/menus.json";
import searchIndex from "../../public/searchIndex.json";
import Fuse from "fuse.js";
const fuse = new Fuse(searchIndex, config.search.site);
const publications = null;
// const fuse = null;

let myApp = {
  config,
  context,
  disclaimers,
  fuse,
  publications,
  menus,
};

export { myApp };
