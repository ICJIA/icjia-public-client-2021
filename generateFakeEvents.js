/* eslint-disable no-unused-vars */

const slug = require("slug");
const axios = require("axios");
const dotenv = require("dotenv").config();

let axiosConfig = {
  headers: {
    "Content-Type": "application/json",
  },
};
//console.log(axiosConfig);

function rnd(a, b) {
  return Math.floor((b - a + 1) * Math.random()) + a;
}

function titleCase(str) {
  str = str.toLowerCase().split(" ");
  for (var i = 0; i < str.length; i++) {
    str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
  }
  return str.join(" ");
}

(async function () {
  let { data } = await axios.get(process.env.MOCKAROO_EVENTS_API);
  const min = new Date(`${"2020-12-01"}T00:00:00`);
  const max = new Date(`${"2021-12-01"}T23:59:59`);
  const days = (max.getTime() - min.getTime()) / 86400000;
  const eventCount = rnd(days, days + 120);

  const events = data.map((event) => {
    const allDay = rnd(0, 3) === 0;
    const firstTimestamp = rnd(min.getTime(), max.getTime());
    const first = new Date(firstTimestamp - (firstTimestamp % 900000));
    const secondTimestamp = rnd(2, allDay ? 288 : 8) * 900000;
    const second = new Date(first.getTime() + secondTimestamp);
    event.name = titleCase(event.name);
    event.start = first;
    event.end = second;
    event.timed = !allDay;
    event.slug = slug(event.name);
    return event;
  });

  events.forEach(async (event) => {
    let response = await axios.post(
      `${process.env.BASE_API}/events`,
      JSON.stringify(event),
      axiosConfig
    );
    console.log(response.data);
  });
})();
