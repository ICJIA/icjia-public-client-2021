// =============================================================================
// Cards whose title is the link, and focus after paging
// Biography and event cards: the name or title is the link, and a click
// anywhere else on the card still opens the page, except where the card is
// the page itself. News: after a page is chosen, focus moves to the first
// heading of the page shown. The components' methods run against plain
// objects.
// =============================================================================
import { expect } from "chai";
import BiographyCard from "@/components/BiographyCard.vue";
import EventCard from "@/components/EventCard.vue";
import News from "@/views/News/News.vue";

const onPage = (html) => {
  document.body.innerHTML = html;
};

describe("Biography card clicks", () => {
  const card = (state = {}) => {
    const vm = {
      showName: true,
      item: { slug: "delrice-adams" },
      pushed: [],
      ...state,
    };
    vm.$router = { push: (path) => vm.pushed.push(path) };
    vm.biographyPath = BiographyCard.computed.biographyPath.call(vm);
    vm.onCardClick = BiographyCard.methods.onCardClick.bind(vm);
    return vm;
  };

  it("opens the biography from a click on the card's text", () => {
    onPage('<div class="card"><p id="text">Biography</p></div>');
    const vm = card();
    vm.onCardClick({ target: document.getElementById("text") });
    expect(vm.pushed).to.deep.equal(["/about/biographies/delrice-adams"]);
  });

  it("leaves a click on a link, the name or one in the text, to the link", () => {
    onPage(
      '<div class="card"><a href="/elsewhere"><span id="in">x</span></a></div>'
    );
    const vm = card();
    vm.onCardClick({ target: document.getElementById("in") });
    expect(vm.pushed).to.deep.equal([]);
  });

  it("does not link a biography's card to its own page", () => {
    onPage('<div class="card"><p id="text">Biography</p></div>');
    const vm = card({ showName: false });
    vm.onCardClick({ target: document.getElementById("text") });
    expect(vm.pushed).to.deep.equal([]);
  });
});

describe("Event card clicks", () => {
  const card = (state = {}) => {
    const vm = {
      isClickable: true,
      item: { fullPath: "/events/webinar" },
      pushed: [],
      ...state,
    };
    vm.$router = { push: (path) => vm.pushed.push(path) };
    vm.onCardClick = EventCard.methods.onCardClick.bind(vm);
    return vm;
  };

  it("opens the event from a click on the card", () => {
    onPage('<div class="card"><p id="text">Details</p></div>');
    const vm = card();
    vm.onCardClick({ target: document.getElementById("text") });
    expect(vm.pushed).to.deep.equal(["/events/webinar"]);
  });

  it("leaves a click on the title link to the link", () => {
    onPage(
      '<div class="card"><a href="/events/webinar" id="title">T</a></div>'
    );
    const vm = card();
    vm.onCardClick({ target: document.getElementById("title") });
    expect(vm.pushed).to.deep.equal([]);
  });

  it("opens nothing on the event's own page", () => {
    onPage('<div class="card"><p id="text">Details</p></div>');
    const vm = card({ isClickable: false });
    vm.onCardClick({ target: document.getElementById("text") });
    expect(vm.pushed).to.deep.equal([]);
  });

  it("puts the title in a div unless the card is the page's item", () => {
    expect(EventCard.props.titleTag.default).to.equal("div");
  });
});

describe("News paging moves focus to the page shown", () => {
  const list = () => {
    onPage(
      '<div id="list"><h3 class="group-heading">Earlier</h3>' +
        '<a href="/news/x">Post</a></div><button id="page2">2</button>'
    );
    document.getElementById("page2").focus();
    return document.getElementById("list");
  };

  it("focuses the first heading once a chosen page is shown", () => {
    const vm = { focusListWhenShown: true, $refs: { newsList: list() } };
    News.methods.focusList.call(vm);
    expect(document.activeElement.textContent).to.equal("Earlier");
    expect(vm.focusListWhenShown).to.equal(false);
  });

  it("leaves focus alone when the list changes for another reason", () => {
    const vm = { focusListWhenShown: false, $refs: { newsList: list() } };
    News.methods.focusList.call(vm);
    expect(document.activeElement.id).to.equal("page2");
  });
});
