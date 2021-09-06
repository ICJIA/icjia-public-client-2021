/* eslint-disable no-unused-vars */
const fs = require("fs").promises;
const path = require("path");

export async function handler(event, context) {
  const content = await fs.readFile("./public/data.json", {
    encoding: "utf-8",
  });

  return {
    statusCode: 200,
    body: content,
  };
}
