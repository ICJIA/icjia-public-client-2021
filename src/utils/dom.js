const attachInternalLinks = function (vm) {
  let els = document.querySelectorAll("[data-event-link]");
  for (const node of els) {
    node.addEventListener("click", function (e) {
      e.preventDefault();
      vm.$router.push(this.dataset.eventLink);
    });
  }
};

export { attachInternalLinks };
