const fs = require("fs");
const pkg = require("../package.json");
const moment = require("moment");
// eslint-disable-next-line no-unused-vars
const tz = require("moment-timezone");
const tstamp = moment();
const chicagoTime = tstamp
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
repository:     ${pkg.repository.url}
license:        ${pkg.license}
*************************************************************************************************************************

-->`;

fs.appendFile("./dist/index.html", `${banner}`, function (err) {
  if (err) throw err;
  console.log("Build banner inserted.");
});
