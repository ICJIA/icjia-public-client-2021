import { EventBus } from "@/event-bus";

const attachInternalLinks = function (vm) {
  vm.$nextTick(() => {
    let els = document.querySelectorAll("[data-event-link]");
    for (const node of els) {
      node.addEventListener("click", function (e) {
        e.preventDefault();
        vm.$router.push(this.dataset.eventLink);
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
    console.log("attachInternalLinks: ", els);
  });
};

export { attachInternalLinks, attachSearchEvents };
