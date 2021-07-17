/* eslint-disable no-unused-vars */
const fs = require("fs");
const axios = require("axios");
const jsonfile = require("jsonfile");
const _ = require("lodash");
// const { apiBaseURL } = require("./src/config");

const query = `query {
 units {
    title
    id
    title
    slug
    summary
    shortName
    url
    published_at
  }
}`;

axios
  .create({ baseURL: "https://agency.icjia-api.cloud" })
  .post("/graphql", { query, validateStatus: (status) => status === 200 })
  .then((res) => {
    let units = res.data.data.units;

    units = units.map((u) => ({
      ...u,
      fullPath: `/about/units/${u.slug}/`,
      altTitle: u.title.toLowerCase(),
      imagePath: null,
      contentType: "unit",
    }));

    let content = [...units];
    content = _.orderBy(content, ["title"], ["asc"]);

    jsonfile.writeFile(`./src/config/units.json`, content, function (err) {
      if (err) console.error(err);
      console.log(`Created: ./src/config/units.json`);
    });
  })
  .catch((err) => console.error(err));
