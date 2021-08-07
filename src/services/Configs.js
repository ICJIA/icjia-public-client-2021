module.exports = (async function () {
  //some async initiallizers
  //e.g. await the db module that has the same structure like this
  let response = await fetch("https://agency.icjia-api.cloud/configs");
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  let data = await response.json();
  //console.log("fetch response: ", data);

  return {
    data,
  };
})();
