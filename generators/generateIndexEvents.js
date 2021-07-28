/* eslint-disable no-unused-vars */
const fs = require("fs");
const axios = require("axios");
const jsonfile = require("jsonfile");
const _ = require("lodash");
// const { apiBaseURL } = require("./src/config");

const query = `query {
  events(sort: "start:asc") {
      id
      created_at
      updated_at
      published_at
      title: name
      start
      end
      timed
      summary
      category
      slug
    tags {
      title
      slug
    }
      
    }
}`;

axios
  .create({ baseURL: "https://agency.icjia-api.cloud" })
  .post("/graphql", { query, validateStatus: (status) => status === 200 })
  .then((res) => {
    let events = res.data.data.events;

    events.forEach((event) => {
      if (event.tags && event.tags.length > 0) {
        let tagArray = [];
        const tagValues = Object.values(event.tags);
        tagValues.forEach((t) => {
          tagArray.push(t.title);
        });
        // console.log(tagArray);
        event.tagsAlt = event.tags;
        event.tags = tagArray;
      }
    });
    events = events.map((e) => {
      let imagePath;
      if (e.splash) {
        imagePath = `https://agency.icjia-api.cloud${e.splash.url}`;
      } else {
        imagePath = null;
      }
      let obj = {
        ...e,
        altTitle: e.title.toLowerCase(),
        fullPath: `/events/${e.slug}/`,
        imagePath,
        contentType: "event",
      };
      return obj;
    });

    let content = [...events];
    content = _.orderBy(content, ["date"], ["desc"]);

    jsonfile.writeFile(`./src/config/events.json`, content, function (err) {
      if (err) console.error(err);
      console.log(`Created: ./src/config/events.json`);
    });
  })
  .catch((err) => console.error(err));
