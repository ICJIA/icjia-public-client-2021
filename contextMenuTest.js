/* eslint-disable no-unused-vars */
/* eslint-disable no-mixed-operators */
/* eslint-disable eqeqeq */
/* eslint-disable no-prototype-builtins */

const json = require("./src/contextMenus.json");
// const _ = require("lodash");

let fullPath = "/researchhubd/articles/test-article";
fullPath += fullPath.endsWith("/") ? "" : "/";
let contextPath = fullPath.split("/").slice(1, -1);
contextPath = "/" + contextPath.slice(0, 1).join("/") + "/";
console.log(contextPath);

const key = "pathPrefix";

let found = json.filter((obj) => {
  if (obj[key] === contextPath) {
    return obj;
  }
});

console.log(JSON.stringify(found));
