const axios = require("axios");
require("dotenv").config();
const moment = require("moment");
// eslint-disable-next-line no-unused-vars
const tz = require("moment-timezone");
const tstamp = moment();
const chicagoTime = tstamp
  .tz("America/Chicago")
  .format("dddd, MMMM Do YYYY, h:mm:ssa z");

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET",
};

const limit = 100;

exports.handler = (event, context, callback) => {
  // console.log(process.env);
  let period = event.queryStringParameters.period;
  if (!period) {
    period = "day";
  }

  axios
    .get(
      `${process.env.PLAUSIBLE_API_BASE}/api/v1/stats/breakdown?site_id=icjia.illinois.gov&period=${period}&property=event:page&limit=${limit}`,
      {
        headers: {
          "cache-control": "no-cache",
          Authorization: `Bearer ${process.env.PLAUSIBLE_API_KEY}`,
        },
      }
    )
    .then((res) => {
      let jsonResponse = {
        results: res.data.results,
        period: period,
        date: chicagoTime,
      };
      callback(null, {
        statusCode: 200,
        headers,
        body: JSON.stringify(jsonResponse),
      });
    })
    .catch((err) => {
      callback(err);
    });
};
