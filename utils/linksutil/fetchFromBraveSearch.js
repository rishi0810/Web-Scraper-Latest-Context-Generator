import axios from "axios";
import * as cheerio from "cheerio";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";
import iconv from "iconv-lite";
import linkFilter from "../functions/linkFilter.js";

import { configDotenv } from "dotenv";
configDotenv();

const fetchFromBraveSearch = async (query, options = {}) => {
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
  const baseURL = process.env.BRAVE_URL;
  const params = { q: query, source: "web", lang: "en-in" };
  const headers = {
    accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-language": "en-US,en;q=0.9",
    "if-none-match": 'W/"v4es00"',
    priority: "u=0.5, i",
    referer: `${baseURL}?q=${encodeURIComponent(query)}&source=web&lang=en-in`,
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
      const response = await client.get(baseURL, {
        params,
        headers,
        responseType: "arraybuffer",
        timeout: 3000,
      });

      if (response.status !== 200) {
        throw new Error("Brave returned non-200 status");
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
      const resultsContainer = $("#results");
      const braveLinks = [];

      if (resultsContainer.length) {
        const snippets = resultsContainer.find("div.snippet");
        snippets.each((si, s) => {
          const a = $(s).find("a[href]").first();
          if (a && a.length) {
            const href = a.attr("href");
            if (href && typeof href === "string") {
              const trimmed = href.trim();
              if (trimmed.startsWith("https://")) {
                braveLinks.push(trimmed);
              }
            }
          }
        });
      }

      const normalized = braveLinks
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
        throw new Error(`Failed to fetch from Brave: ${error.message}`);
      }
    }
  }
};

export default fetchFromBraveSearch;
