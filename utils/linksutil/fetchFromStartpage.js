import axios from "axios";
import * as cheerio from "cheerio";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";
import iconv from "iconv-lite";
import linkFilter from "../functions/linkFilter.js";

import { configDotenv } from "dotenv";
configDotenv();

const baseURL = process.env.STARTPAGE_URL;
const refOrgURL = process.env.STARTPAGE_REF_ORG_URL;

const fetchFromStartpage = async (query, options = {}) => {
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

  const data = {
    query: query,
    abp: "1",
    abe: "1",
    t: "device",
    lui: "english",
    sc: "8kkNLOqO6uYB20",
    cat: "web",
    abd: "1",
    abe: "1",
  };
  const headers = {
    accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-language": "en-US,en;q=0.9",
    "cache-control": "max-age=0",
    "content-type": "application/x-www-form-urlencoded",
    origin: `${refOrgURL}`,
    priority: "u=0, i",
    referer: `${refOrgURL}/`,
    "sec-ch-ua": '"Chromium";v="141", "Not?A_Brand";v="8"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "same-origin",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
  };

  for (let i = 0; i < retries; i++) {
    try {
      const response = await client.post(baseURL, data, {
        headers,
        responseType: "arraybuffer",
        timeout: 3000,
      });

      if (response.status !== 200) {
        throw new Error("Startpage returned non-200 status");
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
      const mainSec = $("#main");
      const spgLinks = [];

      if (mainSec.length) {
        const results = mainSec.find("div.result");
        results.each((i, r) => {
          const a = $(r).find("a.result-title[href]");
          if (a.length) {
            spgLinks.push(a.attr("href"));
          }
        });
      }

      // Normalize strings and delegate scheme/filtering/deduping to linkFilter
      const normalized = spgLinks
        .map((l) => (typeof l === "string" ? l.trim() : ""))
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
        throw new Error(`Failed to fetch from Startpage: ${error.message}`);
      }
    }
  }
};

export default fetchFromStartpage;
