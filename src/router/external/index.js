const external = [
  // {
  //   path: "/adultredeploy/",
  //   redirect: () => {
  //     window.location.href = "https://icjia.illinois.gov/adultredeploy/";
  //     //   return '/redirecting' // not important since redirecting
  //   },
  // },
  {
    path: "/spac/",
    redirect: () => {
      window.location.href = "https://spac.illinois.gov/";
      //   return '/redirecting' // not important since redirecting
    },
  },
  {
    path: "/ifvcc/",
    redirect: () => {
      window.location.href = "http://www.icjia.org/ifvcc";
      //   return '/redirecting' // not important since redirecting
    },
  },
  {
    path: "/archive/",
    redirect: () => {
      window.location.href = "https://archive.icjia.cloud/";
      //   return '/redirecting' // not important since redirecting
    },
  },
];

export { external };
