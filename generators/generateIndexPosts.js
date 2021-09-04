/* eslint-disable no-unused-vars */
const fs = require("fs");
const axios = require("axios");
const jsonfile = require("jsonfile");
const _ = require("lodash");

// const { apiBaseURL } = require("./src/config");

const query = `query {
 posts {
    id
    title
    created_at
    updated_at
    slug
    summary
    category
    searchMeta
    published_at
    dateOverride
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

const getPublicationDate = function (posts) {
  let updated = posts.map((e) => ({
    ...e,
    publicationDate:
      e.dateOverride && e.dateOverride.length ? e.dateOverride : e.published_at,
  }));
  return updated;
};

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
    let posts = res.data.data.posts;

    posts = posts.map((p) => {
      let imagePath;
      if (p.splash) {
        imagePath = `https://agency.icjia-api.cloud${p.splash.url}`;
      } else {
        imagePath = null;
      }
      let obj = {
        ...p,
        altTitle: p.title.toLowerCase(),
        fullPath: `/news/${p.slug}/`,
        imagePath,
        displayCategory: p.category,
        contentType: "news",
      };
      return obj;
    });
    posts = getPublicationDate(posts);
    posts = getUnifiedTags(posts);
    let content = [...posts];
    content = _.orderBy(content, ["date"], ["desc"]);

    const dirpath = "./public/api";
    if (!fs.existsSync(dirpath)) fs.mkdirSync(dirpath);

    jsonfile.writeFile(`./public/api/posts.json`, content, function (err) {
      if (err) console.error(err);
      console.log(`Created: ./public/api/posts.json`);
    });
  })
  .catch((err) => console.error(err));
