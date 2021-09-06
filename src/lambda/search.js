/* eslint-disable no-unused-vars */
const fs = require("fs").promises;
const path = require("path");
const content = require("./searchIndex.json");
export async function handler(event, context) {
  // const content = await fs.readFile("data.json", {
  //   encoding: "utf-8",
  // });
  // const content = await fs.readFile(path.resolve("./data.json"), {
  //   encoding: "utf-8",
  // });
  console.log(path.join("data.json"));
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: content,
    }),
  };
}
