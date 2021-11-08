/* eslint-disable no-unused-vars */
const fs = require("fs");
const axios = require("axios");
const jsonfile = require("jsonfile");
const _ = require("lodash");
// const { apiBaseURL } = require("./src/config");

const query = `query {
 pages {
    id
    title
    created_at
    updated_at
    slug
    summary
    category
    searchMeta
    published_at
    hideFromSearch
    tags {
      title
      slug
    }
    
    splash {
      name
      caption
      alternativeText
      url
      formats
    }
  }
}`;

const getUnifiedTags = function (content) {
  content.forEach((item) => {
    if (item.tagsAlt && item.tagsAlt.length) return content;
    if (item.tags && item.tags.length > 0) {
      let tagArray = [];
      const tagValues = Object.values(item.tags);
      tagValues.forEach((t) => {
        tagArray.push(t.title);
      });
      // console.log(tagArray);
      item.tagsAlt = item.tags;
      item.tags = tagArray;
    }
  });
  //console.log(content);
  return content;
};

axios
  .create({ baseURL: "https://agency.icjia-api.cloud" })
  .post("/graphql", { query, validateStatus: (status) => status === 200 })
  .then((res) => {
    let pages = res.data.data.pages;
    pages.forEach((page) => {
      if (page.category === "informationSystems") {
        page.category = "information-systems";
      }
    });
    pages = pages.filter((page) => {
      return !page.hideFromSearch;
    });
    //console.log(pages);
    pages = getUnifiedTags(pages);
    pages = pages.map((p) => {
      let imagePath;
      if (p.splash) {
        imagePath = `https://agency.icjia-api.cloud${p.splash.url}`;
      } else {
        imagePath = null;
      }
      let obj = {
        ...p,
        altTitle: p.title.toLowerCase(),
        fullPath:
          p.category === "general"
            ? `/${p.slug}/`
            : `/${p.category}/${p.slug}/`,
        imagePath,
        contentType: "page",
      };
      return obj;
    });

    let content = [...pages];
    content = _.orderBy(content, ["date"], ["desc"]);

    const dirpath = "./public/api";
    if (!fs.existsSync(dirpath)) fs.mkdirSync(dirpath);

    jsonfile.writeFile(`./public/api/pages.json`, content, function (err) {
      if (err) console.error(err);
      console.log(`Created: ./public/api/pages.json`);
    });
  })
  .catch((err) => console.error(err));
