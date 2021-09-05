if (isIE(window.navigator.userAgent)) {
  document.querySelector("#app").innerHTML = createBanner();
} else {
  //document.querySelector("#app").innerHTML = "this is entry.js";
  require("./main");
}

function isIE(ua) {
  const isIE10orLess = ua.indexOf("MSIE") > -1;
  const isIE11 = ua.indexOf("Trident/") > -1;
  // console.log(ua);
  // console.log(isIE10orLess, isIE11);
  return isIE10orLess || isIE11;
}

function createBanner() {
  // const baseURL = process.env.BASE_URL;

  return `
  <div style="text-align: center; font-size: 0.7em; margin-top: 50px;">
    <img src="/icjia-logo-min.png" alt="ICJIA Logo" style="margin-bottom: 30px;">
    <h1 style='font-family: Lato, sans-serif; padding-top: 20px; padding-bottom:20px; background: #eee;'>
      The ICJIA  website no longer supports Internet Explorer.
      <br><br>
      Please upgrade to a secure, modern browser such as
      <a href='https://www.google.com/chrome/'>Chrome</a>,
      <a href='https://www.mozilla.org/en-US/firefox/new/'>Firefox</a>, or
      <a href='https://www.microsoft.com/en-us/windows/microsoft-edge'>MS Edge</a>.
    </h1>
   
  </div>
  <div style="text-align: center; margin-top: 55px; padding-left: 50px; padding-right: 50px">
   <h2>If you're unable to upgrade your browser and want to view current ICJIA content, including the latest news, funding opportunities, and meeting information, please consider using our <a href="/ie11/">RSS feeds</a>.<br/> <br/><a href="/ie11/">Click for more information about RSS and direct links to our feeds</a>.</h2>
    </div>`;
}
