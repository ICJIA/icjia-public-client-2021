const fs = require("fs");
const pkg = require("../package.json");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const advancedFormat = require("dayjs/plugin/advancedFormat");
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(advancedFormat);
const chicagoTime = dayjs()
  .tz("America/Chicago")
  .format("dddd, MMMM Do YYYY, h:mm:ssa z");

const banner = `

<!-- 

*************************************************************************************************************************
last build:     ${chicagoTime}
name:           ${pkg.name}
description:    ${pkg.description}
homepage:       ${pkg.homepage}
version:        ${pkg.version}
author:         ${pkg.author.name} (${pkg.author.email})
*************************************************************************************************************************

-->`;

fs.appendFile("./dist/index.html", `${banner}`, function (err) {
  if (err) throw err;
  console.log("Build banner inserted.");
});
