import axios from "axios";
import * as cheerio from "cheerio";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";
import iconv from "iconv-lite";
import linkFilter from "../functions/linkFilter.js";

import { configDotenv } from "dotenv";
configDotenv();

const fetchFromYahoo = async (query, options = {}) => {
  if (!query) {
    throw new Error("query parameter is required");
  }
  const {
    retries = 2,
    retryDelay = 100,
    cookieJar = new CookieJar(),
  } = options;

  const client = wrapper(
    axios.create({
      jar: cookieJar,
      withCredentials: true,
    }),
  );

  const baseURL = process.env.YAHOO_URL;
  const refURL = process.env.YAHOO_REF_URL;

  const params = {
    p: query,
    fr: "yfp-t-s",
    fr2: "p:fp,m:sa,ct:sa,kt:none",
    ei: "UTF-8",
    fp: "1",
    mkr: "8",
  };
  const headers = {
    accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-language": "en-US,en;q=0.9",
    "cache-control": "max-age=0",
    priority: "u=0, i",
    referer: `${refURL}?guccounter=1`,
    "sec-ch-ua": '"Chromium";v="141", "Not?A_Brand";v="8"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "same-site",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
  };

  for (let i = 0; i < retries; i++) {
    try {
      const response = await client.get(baseURL, {
        params,
        headers,
        responseType: "arraybuffer",
        timeout: 3000,
      });

      if (response.status !== 200) {
        throw new Error("Yahoo returned non-200 status");
      }

      const contentType = response.headers["content-type"];
      let charset = "utf-8";
      if (contentType) {
        const charsetMatch = contentType.match(/charset=([^;]+)/);
        if (charsetMatch && iconv.encodingExists(charsetMatch[1])) {
          charset = charsetMatch[1];
        }
      }
      const body = iconv.decode(response.data, charset);

      const $ = cheerio.load(body);
      const containers = $("div.algo");

      const seen = new Set();
      const results = [];

      containers.each((i, c) => {
        const comp = $(c).find("div.compTitle");
        const aTag = comp.find("a[href]");
        if (!aTag.length) return;

        const href = aTag.attr("href");
        const ruIdx = href.indexOf("/RU=");
        const rkIdx = href.indexOf("/RK=");

        if (ruIdx === -1 || rkIdx === -1 || rkIdx <= ruIdx) return;

        const encoded = href.substring(ruIdx + "/RU=".length, rkIdx);
        const decodedUrl = decodeURIComponent(encoded);

        if (!seen.has(decodedUrl)) {
          seen.add(decodedUrl);
          results.push(decodedUrl);
        }
      });

      const normalized = results
        .map((r) => (typeof r === "string" ? r.trim() : ""))
        .filter(Boolean);
      const filteredLinks = linkFilter(normalized);
      return filteredLinks;
    } catch (error) {
      if (i < retries - 1) {
        const delay = retryDelay * Math.pow(2, i);
        console.warn(
          `Attempt ${
            i + 1
          } failed for query "${query}". Retrying in ${delay}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw new Error(`Failed to fetch from Yahoo: ${error.message}`);
      }
    }
  }
};

export default fetchFromYahoo;
