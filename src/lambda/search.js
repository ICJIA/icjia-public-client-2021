/* eslint-disable no-unused-vars */
const fs = require("fs").promises;
const path = require("path");
const content = require("./searchIndex.json");
export async function handler(event, context) {
  //console.log(path.join("data.json"));
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: content,
    }),
  };
}
