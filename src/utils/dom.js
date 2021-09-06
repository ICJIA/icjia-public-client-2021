import { EventBus } from "@/event-bus";

const attachInternalLinks = function (vm) {
  vm.$nextTick(() => {
    let els = document.querySelectorAll("[data-event-link]");
    for (const node of els) {
      node.addEventListener("click", function (e) {
        e.preventDefault();
        console.log("internal click: ", e.target.href);
        //vm.$router.push(this.dataset.eventLink);
        let url = e.target.href;
        url = url.replace(/^.*\/\/[^/]+/, "");
        vm.$router.push(url).catch(() => {});
      });
    }
    console.log("attachInternalLinks: ", els);
  });
};

const attachSearchEvents = function (vm) {
  vm.$nextTick(() => {
    let els = document.querySelectorAll("[data-event-search]");
    for (const el of els) {
      el.classList.add("author-name");
      el.addEventListener("click", function (e) {
        e.preventDefault();
        let opts = {
          query: e.target.innerText,
          type: "hub",
        };
        EventBus.$emit("search", opts);
      });
    }
    //console.log("attachInternalLinks: ", els);
  });
};

export { attachInternalLinks, attachSearchEvents };
