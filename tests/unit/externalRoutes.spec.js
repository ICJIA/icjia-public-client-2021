/* eslint-env mocha */
// =============================================================================
// Old addresses that lead to the agency's other sites (v1.5.96)
//
// A search for "i2i" opened i2i.illinois.gov by itself, and Back opened it
// again. /i2i/, /spac/, /adultredeploy/ and three more were `redirect`
// functions that set window.location. vue-router runs a route's redirect
// function whenever the route is RESOLVED, and a <router-link> resolves its
// target when it is drawn. Since the search results' titles became links
// (v1.5.87), drawing the result for the CMS page at /i2i/ left the site.
//
// Drawing a link must never open a page. These routes now leave the site from
// a guard, which runs only when the address is really being opened.
// =============================================================================
import { expect } from "chai";
import fs from "fs";
import path from "path";
import { mount, createLocalVue } from "@vue/test-utils";
import VueRouter from "vue-router";
import { external, outside } from "@/router/external";

const localVue = createLocalVue();
localVue.use(VueRouter);

describe("Addresses that lead to another site", () => {
  let left;
  let go;
  const router = () =>
    new VueRouter({
      mode: "abstract",
      routes: [
        { path: "/", component: { render: (h) => h("div") } },
        ...external,
      ],
    });

  beforeEach(() => {
    left = [];
    go = outside.go;
    outside.go = (url) => left.push(url);
  });
  afterEach(() => {
    outside.go = go;
  });

  it("resolving one, as a link does when it is drawn, opens nothing", () => {
    const r = router();
    external.forEach((route) => r.resolve(route.path));
    expect(left).to.deep.equal([]);
  });

  it("drawing a link to one opens nothing", () => {
    const wrapper = mount(
      {
        template:
          '<div><router-link to="/i2i/">Institute to Innovate</router-link></div>',
      },
      { localVue, router: router() }
    );
    expect(wrapper.find("a").attributes("href")).to.equal("/i2i/");
    expect(left).to.deep.equal([]);
  });

  it("opening one leaves for the other site, and this site stays where it was", async () => {
    const r = router();
    await r.push("/");
    await r.push("/i2i/").catch(() => {});
    expect(left).to.deep.equal(["https://i2i.illinois.gov/"]);
    expect(r.currentRoute.path).to.equal("/");
  });

  it("every one of them leaves from a guard, none from a redirect", () => {
    expect(external.length).to.be.greaterThan(5);
    external.forEach((route) => {
      expect(route, route.path).to.not.have.property("redirect");
      expect(route.beforeEnter, route.path).to.be.a("function");
    });
  });

  it("no redirect function anywhere in the router touches the window", () => {
    const dir = path.join(process.cwd(), "src/router");
    const files = [];
    const walk = (folder) =>
      fs.readdirSync(folder, { withFileTypes: true }).forEach((entry) => {
        const full = path.join(folder, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (full.endsWith(".js")) files.push(full);
      });
    walk(dir);
    expect(files.length).to.be.greaterThan(5);
    // Code only: two files keep such redirects as comments.
    const code = (file) =>
      fs
        .readFileSync(file, "utf8")
        .split("\n")
        .filter((line) => !line.trim().startsWith("//"))
        .join("\n");
    const offenders = files.filter((file) =>
      /redirect:[^}]*window\./.test(code(file))
    );
    expect(offenders.map((file) => path.relative(dir, file))).to.deep.equal([]);
  });

  it("they still lead where they led", async () => {
    const expected = {
      "/adultredeploy/": "https://icjia.illinois.gov/adultredeploy/",
      "/ifvcc/": "https://icjia.illinois.gov/ifvcc/",
      "/spac/": "https://spac.illinois.gov/",
      "/archive/": "https://archive.icjia.cloud/",
      "/intranet/": "https://intranet.icjia.cloud/",
      "/i2i/": "https://i2i.illinois.gov/",
    };
    const r = router();
    await r.push("/");
    for (const path of Object.keys(expected)) {
      await r.push(path).catch(() => {});
    }
    expect(left).to.deep.equal(Object.values(expected));
  });
});
