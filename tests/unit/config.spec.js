// =============================================================================
// Configuration and static data integrity tests
// Validates config files, API data structure, and build settings.
// =============================================================================
/* eslint-env mocha */
import { expect } from "chai";
import config from "@/config/config.json";

const fs = require("fs");
const ROOT = process.cwd();

describe("Application config (config.json)", () => {
  it("has API base URL using HTTPS", () => {
    expect(config.api.base).to.match(/^https:\/\//);
  });

  it("has GraphQL endpoint using HTTPS", () => {
    expect(config.api.baseGraphQL).to.match(/^https:\/\//);
  });

  it("has client base URL using HTTPS", () => {
    expect(config.api.baseClient).to.match(/^https:\/\//);
  });

  it("has a login path", () => {
    expect(config.api.login).to.be.a("string");
    expect(config.api.login).to.include("/auth/");
  });

  it("has a reasonable timeout", () => {
    expect(config.api.timeout).to.be.a("number");
    expect(config.api.timeout).to.be.greaterThan(1000);
    expect(config.api.timeout).to.be.lessThan(60000);
  });

  it("points to icjia domains", () => {
    expect(config.api.base).to.include("icjia");
    expect(config.api.baseClient).to.include("icjia");
  });
});

describe("API data files (public/api/*.json)", () => {
  const apiDir = ROOT + "/public/api";
  const expectedFiles = [
    "biographies.json",
    "events.json",
    "grants.json",
    "hub.json",
    "jobs.json",
    "meetings.json",
    "pages.json",
    "posts.json",
    "publications.json",
    "units.json",
  ];

  expectedFiles.forEach((filename) => {
    describe(filename, () => {
      let data;
      before(() => {
        const content = fs.readFileSync(apiDir + "/" + filename, "utf8");
        data = JSON.parse(content);
      });

      it("exists and is valid JSON", () => {
        expect(data).to.not.be.null;
      });

      it("is an array", () => {
        expect(data).to.be.an("array");
      });

      it("has at least one entry", () => {
        expect(data.length).to.be.greaterThan(0);
      });

      it("each entry has required fields", () => {
        data.forEach((item) => {
          expect(item).to.have.property("title");
          expect(item).to.have.property("slug");
          expect(item).to.have.property("contentType");
          expect(item).to.have.property("fullPath");
        });
      });

      it("all fullPath values start with /", () => {
        data.forEach((item) => {
          expect(item.fullPath).to.match(/^\//);
        });
      });

      it("no entries have null contentType", () => {
        data.forEach((item) => {
          expect(item.contentType).to.not.be.null;
          expect(item.contentType).to.be.a("string");
        });
      });

      it("no duplicate slugs", () => {
        const slugs = data.map((d) => d.slug);
        const unique = [...new Set(slugs)];
        expect(slugs.length).to.equal(unique.length);
      });
    });
  });
});

describe("Environment files", () => {
  it(".env.sample exists", () => {
    expect(fs.existsSync(ROOT + "/.env.sample")).to.be.true;
  });

  it(".gitignore blocks .env files", () => {
    const gitignore = fs.readFileSync(ROOT + "/.gitignore", "utf8");
    expect(gitignore).to.include(".env");
  });
});

describe("Build configuration", () => {
  it("vue.config.js disables production source maps", () => {
    const vueConfig = fs.readFileSync(ROOT + "/vue.config.js", "utf8");
    expect(vueConfig).to.include("productionSourceMap: false");
  });

  it("babel.config.js strips console in production", () => {
    const babelConfig = fs.readFileSync(ROOT + "/babel.config.js", "utf8");
    expect(babelConfig).to.include("transform-remove-console");
  });

  it("netlify.toml pins a NODE_VERSION", () => {
    const netlify = fs.readFileSync(ROOT + "/netlify.toml", "utf8");
    expect(netlify).to.match(/NODE_VERSION\s*=\s*"\d+"/);
  });
});

describe("Route data completeness", () => {
  const apiDir = ROOT + "/public/api";

  it("pages.json covers core site sections", () => {
    const pages = JSON.parse(fs.readFileSync(apiDir + "/pages.json", "utf8"));
    const paths = pages.map((p) => p.fullPath);

    const required = [
      "/about/about-the-authority/",
      "/about/contact/",
      "/grants/funding/",
      "/researchhub/hub-home/",
    ];
    required.forEach((rp) => {
      expect(paths).to.include(rp);
    });
  });

  it("units.json has at least 5 organizational units", () => {
    const units = JSON.parse(fs.readFileSync(apiDir + "/units.json", "utf8"));
    expect(units.length).to.be.greaterThanOrEqual(5);
  });

  it("publications.json has > 500 entries", () => {
    const pubs = JSON.parse(
      fs.readFileSync(apiDir + "/publications.json", "utf8")
    );
    expect(pubs.length).to.be.greaterThan(500);
  });
});
