// Old addresses on this site that lead to the agency's other sites.
//
// They leave from a guard, not from a `redirect` function. vue-router runs a
// route's redirect function whenever the route is resolved, and a
// <router-link> resolves its target when it is drawn: once the search results'
// titles were links (v1.5.87), drawing the result for the CMS page at /i2i/
// sent the browser to i2i.illinois.gov, and Back drew it again (v1.5.96). A
// guard runs only when the address is really being opened. Drawing a link must
// never open a page.
//
// `outside.go` is what leaves, so that tests can watch it
// (tests/unit/externalRoutes.spec.js).
const outside = {
  go(url) {
    window.location.href = url;
  },
};

// This site stays on the page it was showing while the browser leaves.
const leaveFor = (url) => (to, from, next) => {
  outside.go(url);
  next(false);
};

const external = [
  {
    path: "/adultredeploy/",
    beforeEnter: leaveFor("https://icjia.illinois.gov/adultredeploy/"),
  },
  {
    path: "/ifvcc/",
    beforeEnter: leaveFor("https://icjia.illinois.gov/ifvcc/"),
  },
  {
    path: "/spac/",
    beforeEnter: leaveFor("https://spac.illinois.gov/"),
  },
  {
    path: "/archive/",
    beforeEnter: leaveFor("https://archive.icjia.cloud/"),
  },
  {
    path: "/intranet/",
    beforeEnter: leaveFor("https://intranet.icjia.cloud/"),
  },
  {
    path: "/i2i/",
    beforeEnter: leaveFor("https://i2i.illinois.gov/"),
  },
];

export { external, outside };
