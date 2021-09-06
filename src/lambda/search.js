/* eslint-disable no-unused-vars */
const fs = require("fs").promises;
const path = require("path");

export async function handler(event, context) {
  const content = await fs.readFile(path.join(__dirname, "data.json"), {
    encoding: "utf-8",
  });
  // const content = await fs.readFile(path.resolve("./dist/searchIndex.json"), {
  //   encoding: "utf-8",
  // });

  return {
    statusCode: 200,
    body: content,
  };
}
