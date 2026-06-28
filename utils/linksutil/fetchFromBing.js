import axios from "axios";
import * as cheerio from "cheerio";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";
import iconv from "iconv-lite";
import fs from "fs";
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
      const pageTitle = $("title").text();
      const algoCount = $("li.b_algo").length;
      const bResults = $("#b_results");
      const allLiClasses = [];
      bResults.find("> li").each((_, el) => {
        allLiClasses.push($(el).attr("class") || "(no class)");
      });
      console.log(
        `[Bing:debug] status=${response.status} title="${pageTitle}" li.b_algo=${algoCount} bodyLen=${body.length}`,
      );
      if (algoCount === 0) {
        try {
          fs.writeFileSync("debug_bing.html", body, "utf-8");
        } catch (writeErr) {
          console.error(
            "[Bing:debug] Failed to write debug_bing.html:",
            writeErr,
          );
        }
        const allIds = [];
        $("[id]").each((_, el) => {
          allIds.push($(el).prop("tagName") + "#" + $(el).attr("id"));
        });
        const anchorCount = $("a[href]").length;
        console.log(
          `[Bing:debug] All IDs (${allIds.length}): [${allIds.slice(0, 30).join(", ")}]`,
        );
        console.log(`[Bing:debug] Total <a> with href: ${anchorCount}`);
      }

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

      if (filteredLinks.length === 0) {
        console.warn(
          `[Bing:debug] 0 links found. Body snippet: ${body.substring(0, 500)}`,
        );
      }

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
