/* eslint-disable no-prototype-builtins */

const json = require("../config/contextMenus.json");
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

const getContextMenu = function (jsonKey = "path", appRoute) {
  let contextMenu = {};
  json.forEach((item) => {
    const arr = getObjects(item, jsonKey.toLowerCase(), appRoute.toLowerCase());
    if (arr.length) {
      contextMenu = item;
    }
  });
  return contextMenu;
};

const getPublicationType = function (type) {
  let cleanType;
  switch (type) {
    case "researchReport":
      cleanType = "Research Report";
      break;
    case "researchBulletin":
      cleanType = "Research Bulletin";
      break;
    case "researchAtAGlance":
      cleanType = "Research At A Glance";
      break;
    case "trendsAndIssuesUpdate":
      cleanType = "Trends and Issues Update";
      break;
    case "motorVehicleTheftPublications":
      cleanType = "Motor Vehicle Theft Publication";
      break;
    case "barj":
      cleanType = "BARJ";
      break;
    case "compiler":
      cleanType = "Compiler";
      break;
    case "dataset":
      cleanType = "Dataset";
      break;
    case "getTheFacts":
      cleanType = "GET THE FACTS";
      break;
    case "programEvaluationSummary":
      cleanType = "Program Evaluation Summary";
      break;
    case "megProfiles":
      cleanType = "MEG Profiles";
      break;
    case "annualReport":
      cleanType = "Annual Report";
      break;
    case "article":
      cleanType = "Article";
      break;
    case "report":
      cleanType = "Report";
      break;
    case "evaluation":
      cleanType = "Evaluation";
      break;
    case "toolkit":
      cleanType = "Toolkit";
      break;
    case "onGoodAuthority":
      cleanType = "On Good Authority";
      break;
    case "application":
      cleanType = "Application";
      break;

    default:
      cleanType = "General";
  }
  return cleanType;
};

// let value = "/test/test1/";
// value += value.endsWith("/") ? "" : "/";
// const key = "path";

// !_.isEmpty(getContextMenu(json, key, value))
//   ? console.log(getContextMenu(json, key, value))
//   : console.log("not found");

export { getObjects, getValues, getKeys, getContextMenu, getPublicationType };
