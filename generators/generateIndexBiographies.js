/* eslint-disable no-unused-vars */
const fs = require("fs");
const axios = require("axios");
const jsonfile = require("jsonfile");
const _ = require("lodash");
// const { apiBaseURL } = require("./src/config");

const query = `query {
  biographies (
    sort: "lastName:asc"
  ) {
     id
    firstName
    lastName
    title: fullName
    position: title
    suffix
    summary: bio
    unit {
      title
      shortName
      slug
    }
    slug
    updated_at
    published_at
    email
    affiliation
    sortField
    sortModifier
    
  }
}`;

axios
  .create({ baseURL: "https://agency.icjia-api.cloud" })
  .post("/graphql", { query, validateStatus: (status) => status === 200 })
  .then((res) => {
    let biographies = res.data.data.biographies;
    biographies = biographies.map((b) => {
      let obj = {
        ...b,
        contentType: "biography",
        fullPath: `/biographies/${b.slug}/`,
        imagePath: null,
      };

      return obj;
    });

    let content = [...biographies];
    //content = _.orderBy(content, ["lastName"], ["asc"]);

    jsonfile.writeFile(
      `./src/config/biographies.json`,
      content,
      function (err) {
        if (err) console.error(err);
        console.log(`Created: ./src/config/biographies.json`);
      }
    );
  })
  .catch((err) => console.error(err));
