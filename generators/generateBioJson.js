/* eslint-disable no-unused-vars */
const fs = require("fs");
const axios = require("axios");
const jsonfile = require("jsonfile");
const _ = require("lodash");
// const { apiBaseURL } = require("./src/config");

const query = `query {
  biographies  (
    sort: "sortModifier:asc"
  ) {
    
    lastName
    firstName
    fullName
    affiliation
    title
    sortField
    sortModifier,
    unit {
      title
    }
  
    
    
    
    
  }
}`;

axios
  .create({ baseURL: "https://agency.icjia-api.cloud" })
  .post("/graphql", { query, validateStatus: (status) => status === 200 })
  .then((res) => {
    let biographies = res.data.data.biographies;
    // biographies = getUnifiedTags(biographies);
    biographies = biographies.map((b) => {
      let unitUpdated = b.unit ? b.unit.title : "";
      let obj = {
        ...b,
        add: "",
        update: "",
        delete: "",
        unit: unitUpdated,
      };

      delete b.unit;

      return obj;
    });

    let content = [...biographies];
    console.log(content);
    let sortedContent = _.orderBy(content, ["sortField"], ["asc"]);
    console.log(sortedContent);

    const dirpath = ".";
    if (!fs.existsSync(dirpath)) fs.mkdirSync(dirpath);

    jsonfile.writeFile(`./staff_info.json`, sortedContent, function (err) {
      if (err) console.error(err);
      console.log(`Created: ./staff_info.json.json`);
    });
  })
  .catch((err) => console.error(err));
