/* eslint-disable no-unused-vars */
const fs = require("fs").promises;
const path = require("path");
const content = require("./searchIndex.json");
let HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
};

export async function handler(event, context) {
  //console.log(path.join("data.json"));
  return {
    statusCode: 200,
    HEADERS,
    body: JSON.stringify({
      message: content,
    }),
  };
}
