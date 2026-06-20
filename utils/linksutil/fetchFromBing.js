import axios from "axios";
import * as cheerio from "cheerio";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";
import iconv from "iconv-lite";
import linkFilter from "../functions/linkFilter.js";

import { configDotenv } from "dotenv";
configDotenv();

/**
 * Extracts the real destination URL from a Bing redirect link.
 * Bing wraps result URLs as: https://www.bing.com/ck/a?...&u=a1<base64url>&ntb=1
 * The "u" param value starts with "a1" followed by a base64url-encoded URL.
 */
const decodeBingRedirect = (href) => {
  try {
    const url = new URL(href);
    const uParam = url.searchParams.get("u");
    if (uParam && uParam.startsWith("a1")) {
      const encoded = uParam.slice(2);
      // base64url to standard base64
      const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
      const decoded = Buffer.from(base64, "base64").toString("utf-8");
      if (decoded.startsWith("http")) {
        return decoded;
      }
    }
  } catch {
    // not a valid URL or decoding failed
  }
  // If it's already a direct URL, return as-is
  if (href.startsWith("https://") && !href.includes("bing.com/ck/")) {
    return href;
  }
  return null;
};

const fetchFromBing = async (query, options = {}) => {
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

  const baseURL = process.env.BING_URL;
  const params = { q: query };
  const headers = {
    accept: "text/html",
    "accept-language": "en-US,en;q=0.9",
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
  };

  for (let i = 0; i < retries; i++) {
    try {
      const response = await client.get(baseURL, {
        params,
        headers,
        responseType: "arraybuffer",
        timeout: 5000,
      });

      if (response.status !== 200) {
        throw new Error("Bing returned non-200 status");
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
      const seen = new Set();
      const results = [];

      $("li.b_algo").each((_, el) => {
        const a = $(el).find("h2 a[href]").first();
        if (!a.length) return;

        const href = a.attr("href");
        if (!href) return;

        const realUrl = decodeBingRedirect(href);
        if (realUrl && !seen.has(realUrl)) {
          seen.add(realUrl);
          results.push(realUrl);
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
        throw new Error(`Failed to fetch from Bing: ${error.message}`);
      }
    }
  }
};

export default fetchFromBing;
