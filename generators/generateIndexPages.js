/* eslint-disable no-unused-vars */
const fs = require("fs");
const axios = require("axios");
const jsonfile = require("jsonfile");
const _ = require("lodash");
// const { apiBaseURL } = require("./src/config");

const query = `query {
  id
    updated_at
    title
    slug
    summary
    category
    body
    published_at
    tags {
      title
      slug
    }
}`;
