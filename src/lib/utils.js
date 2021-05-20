/* eslint-disable no-prototype-builtins */

const json = require("../contextMenus.json");
// const _ = require("lodash");

const getObjects = function (obj, key, val) {
  let objects = [];
  for (const i in obj) {
    if (!obj.hasOwnProperty(i)) continue;
    if (typeof obj[i] === "object") {
      objects = objects.concat(getObjects(obj[i], key, val));
    }
    // if key matches and value matches or if key matches and value is not passed (eliminating the case where key matches but passed value does not)
    else if ((i == key && obj[i] == val) || (i == key && val == "")) {
      //
      objects.push(obj);
    } else if (obj[i] == val && key == "") {
      // only add if the object is not already in the array
      if (objects.lastIndexOf(obj) == -1) {
        objects.push(obj);
      }
    }
  }
  return objects;
};

// return an array of values that match on a certain key
const getValues = function (obj, key) {
  let objects = [];
  for (const i in obj) {
    if (!obj.hasOwnProperty(i)) continue;
    if (typeof obj[i] === "object") {
      objects = objects.concat(getValues(obj[i], key));
    } else if (i == key) {
      objects.push(obj[i]);
    }
  }
  return objects;
};

// return an array of keys that match on a certain value
const getKeys = function (obj, val) {
  let objects = [];
  for (const i in obj) {
    if (!obj.hasOwnProperty(i)) continue;
    if (typeof obj[i] === "object") {
      objects = objects.concat(getKeys(obj[i], val));
    } else if (obj[i] == val) {
      objects.push(i);
    }
  }
  return objects;
};

const getContextMenu = function (key = "path", value) {
  let contextMenu = {};
  json.forEach((item) => {
    const arr = getObjects(item, key.toLowerCase(), value.toLowerCase());
    if (arr.length) {
      contextMenu = item;
    }
  });
  return contextMenu;
};

// let value = "/test/test1/";
// value += value.endsWith("/") ? "" : "/";
// const key = "path";

// !_.isEmpty(getContextMenu(json, key, value))
//   ? console.log(getContextMenu(json, key, value))
//   : console.log("not found");

export { getObjects, getValues, getKeys, getContextMenu };
