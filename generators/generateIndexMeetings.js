/* eslint-disable no-unused-vars */
const fs = require("fs");
const axios = require("axios");
const jsonfile = require("jsonfile");
const _ = require("lodash");
// const { apiBaseURL } = require("./src/config");

const query = `query {
meetings {
    id
    title
    slug
    start
    end
    summary
    category
    published_at
    tags {
      title
      id
      slug
    }
  }
}`;

axios
  .create({ baseURL: "https://agency.icjia-api.cloud" })
  .post("/graphql", { query, validateStatus: (status) => status === 200 })
  .then((res) => {
    let meetings = res.data.data.meetings;

    meetings = meetings.map((e) => ({
      ...e,
      fullPath: `/news/meetings/${e.slug}/`,
      altTitle: e.title.toLowerCase(),
      imagePath: null,
      contentType: "meeting",
    }));

    let content = [...meetings];
    content = _.orderBy(content, ["end"], ["desc"]);

    jsonfile.writeFile(`./src/config/meetings.json`, content, function (err) {
      if (err) console.error(err);
      console.log(`Created: ./src/config/meetings.json`);
    });
  })
  .catch((err) => console.error(err));
