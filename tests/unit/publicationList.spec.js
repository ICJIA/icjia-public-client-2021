/* eslint-env mocha */
// =============================================================================
// The publications list (v1.5.141): a searchable list in place of the
// expandable table, for /about/publications/, /researchhub/publications/ and
// /news/publications/. Each publication is a heading with its title, its date
// and type, its links, and its summary in the browser's own disclosure. The
// table stays, behind the config's "publicationsView": "table".
// =============================================================================
import { expect } from "chai";
import { mount, createLocalVue } from "@vue/test-utils";
import VueRouter from "vue-router";
import PublicationList from "@/components/PublicationList.vue";
import PublicationsAll from "@/views/About/PublicationsAll.vue";

const localVue = createLocalVue();
localVue.use(VueRouter);
localVue.filter("dateFormatAlt", (d) => d);

const pub = (n, extra = {}) => ({
  id: n,
  title: `Publication ${n}`,
  summary: `Summary ${n}`,
  tags: [],
  pubType: "researchReport",
  publicationDate: `20${String(10 + (n % 15)).padStart(2, "0")}-06-01`,
  fullPath: `/about/publications/p-${n}`,
  localArticlePath: `/researchhub/articles/p-${n}`,
  articleURL: `https://icjia.illinois.gov/researchhub/articles/p-${n}`,
  fileURL: `https://example.org/p-${n}.pdf`,
  ...extra,
});
const sixty = Array.from({ length: 60 }, (_, i) => pub(i + 1));

function listOf(publications = sixty) {
  return mount(PublicationList, {
    localVue,
    router: new VueRouter(),
    propsData: { publications },
    mocks: {
      $myApp: { config: { daysToShowNew: 5 } },
      $vuetify: { goTo: () => {} },
    },
    attachTo: document.body,
  });
}

describe("Publications list", () => {
  it("shows 25 a page, each title a level-2 heading linking to its page, and says how many there are", () => {
    const wrapper = listOf();
    const titles = wrapper.findAll("li.pub-item h2.pub-title a");
    expect(titles.length).to.equal(25);
    expect(wrapper.find(".pub-range").text()).to.equal(
      "Showing 1–25 of 60 publications"
    );
    wrapper.destroy();
  });

  it("gives every control a visible label tied to it", () => {
    const wrapper = listOf();
    for (const id of [
      "pub-search",
      "pub-type",
      "pub-year",
      "pub-sort",
      "pub-per-page",
    ]) {
      expect(wrapper.find(`label[for="${id}"]`).exists(), id).to.be.true;
      expect(wrapper.find(`#${id}`).exists(), id).to.be.true;
    }
    wrapper.destroy();
  });

  it("puts each summary in a disclosure named for its publication, with its topics", () => {
    const wrapper = listOf([pub(1, { tags: ["opioids", "deflection"] })]);
    const details = wrapper.find("details.pub-details");
    expect(details.find("summary").text().replace(/\s+/g, " ")).to.equal(
      "Summary of Publication 1"
    );
    expect(details.find(".pub-details-body p").text()).to.equal("Summary 1");
    expect(details.findAll(".pub-topics li").length).to.equal(2);
    wrapper.destroy();
  });

  it("names each link by its visible words, then the title, and says the file's type", () => {
    const wrapper = listOf([
      pub(1),
      pub(2, { fileURL: "https://example.org/p-2.docx" }),
      pub(3, { pubType: "application", fileURL: "https://example.org/app" }),
    ]);
    const links = wrapper
      .findAll(".pub-links a")
      .wrappers.map((w) => w.text().replace(/\s+/g, " "));
    expect(links).to.include("Read the article: Publication 1");
    expect(links).to.include("Download the PDF: Publication 1");
    expect(links).to.include("Download the file (DOCX): Publication 2");
    expect(links).to.include("Open the application: Publication 3");
    wrapper.destroy();
  });

  it("finds words in a summary or a topic, not only in a title, and says how many it found", async () => {
    const wrapper = listOf([
      pub(1, { summary: "About drone surveillance" }),
      pub(2, { tags: ["drones"] }),
      pub(3),
    ]);
    await wrapper.find("#pub-search").setValue("drone");
    expect(wrapper.findAll("li.pub-item").length).to.equal(2);
    expect(wrapper.find(".pub-range").text()).to.equal(
      "Showing 1–2 of 2 publications"
    );
    await new Promise((resolve) => setTimeout(resolve, 800));
    expect(wrapper.find('[role="status"]').text()).to.equal(
      "Showing 1–2 of 2 publications"
    );
    wrapper.destroy();
  });

  it("moves focus to the range line on the next page, so Tab goes on to its first title", async () => {
    const wrapper = listOf();
    const next = wrapper
      .findAll(".pub-pages button")
      .wrappers.find((b) => b.text() === "Next page");
    await next.trigger("click");
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".pub-range").text()).to.equal(
      "Showing 26–50 of 60 publications"
    );
    expect(document.activeElement).to.equal(wrapper.find(".pub-range").element);
    wrapper.destroy();
  });
});

describe("Publications page: the switch back to the table", () => {
  const useList = PublicationsAll.computed.useList;
  it("shows the list by default, and the table when the config says so", () => {
    expect(useList.call({ $myApp: { config: {} } })).to.equal(true);
    expect(
      useList.call({ $myApp: { config: { publicationsView: "list" } } })
    ).to.equal(true);
    expect(
      useList.call({ $myApp: { config: { publicationsView: "table" } } })
    ).to.equal(false);
  });
});
