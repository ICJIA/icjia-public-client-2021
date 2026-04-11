import config from "@/config/config.json";
import disclaimers from "@/config/disclaimers.json";
import context from "@/config/contextMenus.json";
import menus from "@/config/menus.json";
import searchIndex from "../../public/searchIndex.json";
import Fuse from "fuse.js";
import { deepSanitize } from "@/utils/contentSanitizer";
const fuse = new Fuse(deepSanitize(searchIndex), config.search.site);
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
