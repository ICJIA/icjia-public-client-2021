module.exports = (async function () {
  let response = await fetch("/searchIndex.json");
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  let data = await response.json();

  return {
    data,
  };
})();
