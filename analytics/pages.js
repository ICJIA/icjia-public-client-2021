const axios = require("axios");
// eslint-disable-next-line no-unused-vars
const dotenv = require("dotenv").config();
// "day", "7d", "month", "12mo"
const timePeriods = ["day", "7d", "month"];

var config = {
  method: "get",
  url: `https://analytics.metaincognita.com/api/v1/stats/breakdown?site_id=${process.env.PLAUSIBLE_API_DOMAIN}&period=${timePeriods[0]}&property=event:page&limit=10`,
  headers: {
    Authorization: `Bearer ${process.env.PLAUSIBLE_API_KEY}`,
  },
};

axios(config)
  .then(function (response) {
    let res = response.data;
    res.meta = {
      generated: new Date(),
      period: `${timePeriods[0]}`,
    };
    console.log(res);
  })
  .catch(function (error) {
    console.log(error);
  });
