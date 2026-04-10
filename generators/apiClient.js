const axios = require("axios");

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createApiClient(baseURL) {
  const client = axios.create({ baseURL });

  async function postWithRetry(path, data, retries = MAX_RETRIES) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const res = await client.post(path, data, {
          validateStatus: (status) => status === 200,
        });
        return res;
      } catch (err) {
        if (attempt < retries) {
          const delay = RETRY_DELAY_MS * attempt;
          console.log(
            `[retry] Attempt ${attempt}/${retries} failed for ${baseURL}${path}: ${err.code || err.message}. Retrying in ${delay}ms...`
          );
          await sleep(delay);
        } else {
          console.error(
            `[error] All ${retries} attempts failed for ${baseURL}${path}`
          );
          throw err;
        }
      }
    }
  }

  async function getWithRetry(url, retries = MAX_RETRIES) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const res = await axios.get(url);
        return res;
      } catch (err) {
        if (attempt < retries) {
          const delay = RETRY_DELAY_MS * attempt;
          console.log(
            `[retry] Attempt ${attempt}/${retries} failed for ${url}: ${err.code || err.message}. Retrying in ${delay}ms...`
          );
          await sleep(delay);
        } else {
          console.error(`[error] All ${retries} attempts failed for ${url}`);
          throw err;
        }
      }
    }
  }

  return { postWithRetry, getWithRetry };
}

module.exports = { createApiClient };
