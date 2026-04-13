import { goToSearch } from "@/utils/search";

const attachInternalLinks = function (vm) {
  vm.$nextTick(() => {
    let els = document.querySelectorAll("[data-event-link]");
    for (const node of els) {
      node.addEventListener("click", function (e) {
        e.preventDefault();
        let url = e.target.href;
        url = url.replace(/^.*\/\/[^/]+/, "");
        vm.$router.push(url).catch(() => {});
      });
    }
  });
};

const attachSearchEvents = function (vm) {
  vm.$nextTick(() => {
    let els = document.querySelectorAll("[data-event-search]");
    for (const el of els) {
      el.classList.add("author-name");
      el.addEventListener("click", function (e) {
        e.preventDefault();
        // Was: EventBus.$emit("search", { query, type: "hub" }) → modal.
        // Now navigates to /search/:query so the user keeps context and
        // can open hits in new tabs.
        goToSearch(vm.$router, { query: e.target.innerText, type: "hub" });
      });
    }
  });
};

export { attachInternalLinks, attachSearchEvents };
