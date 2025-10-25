import axios from "axios";
import * as cheerio from "cheerio";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";
import iconv from "iconv-lite";

/**
 * @param {string} url
 * @param {object} [options={}]
 * @param {number} [options.retries=2]
 * @param {number} [options.retryDelay=100]
 * @param {object} [options.headers] -
 * @param {CookieJar} [options.cookieJar]
 * @returns {Promise<object>}
 **/

const pageScraper = async (url, options = {}) => {
  const {
    retries = 2,
    retryDelay = 100,
    headers,
    cookieJar = new CookieJar(),
  } = options;

  const client = wrapper(
    axios.create({
      jar: cookieJar,
      withCredentials: true,
    }),
  );

  for (let i = 0; i < retries; i++) {
    try {
      const response = await client.get(url, {
        headers: headers || {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
        responseType: "arraybuffer",
        timeout: 5000,
      });

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

      const findMainCandidate = ($) => {
        let candidate = $("main").first();
        if (candidate && candidate.length) return candidate;
        candidate = $("article").first();
        if (candidate && candidate.length) return candidate;
        candidate = $('*[role="main"]').first();
        if (candidate && candidate.length) return candidate;

        const idSelectors = ["main", "content", "article", "post"];
        for (const id of idSelectors) {
          candidate = $(`#${id}`).first();
          if (candidate && candidate.length) return candidate;
        }

        const classRegex = /(^|\s)(main|content|article|post)(\s|$)/i;
        candidate = null;
        $("*[class]").each((i, el) => {
          const cls = $(el).attr("class");
          if (cls && classRegex.test(cls)) {
            candidate = $(el);
            return false;
          }
        });
        if (candidate && candidate.length) return candidate;

        let best = null;
        let bestCount = 0;
        $("div").each((i, el) => {
          try {
            const pCount = $(el).find("p").length;
            if (pCount > bestCount) {
              bestCount = pCount;
              best = $(el);
            }
          } catch (e) {}
        });
        if (best && bestCount > 0) return best;
        return $("body");
      };

      const mainEl = findMainCandidate($);
      mainEl.find("script, style, noscript, iframe").remove();
      const paragraphs = [];
      mainEl.find("p").each((i, el) => {
        const t = $(el).text().trim();
        if (t) paragraphs.push(t);
      });
      const mainText = mainEl.text().replace(/\s+/g, " ").trim();

      const parts = [];

      if (paragraphs.length) {
        parts.push("Paragraphs:");
        paragraphs.forEach((p) => parts.push(p));
      }
      if (mainText) {
        parts.push("Main Text:");
        parts.push(mainText);
      }

      const sanitize = (s) =>
        String(s)
          .replace(/\r?\n|\t/g, " ")
          .replace(/\s+/g, " ")
          .trim();

      const finalText = parts
        .filter((p) => p != null && p !== "")
        .map(sanitize)
        .join(" ")
        .trim();

      return finalText;
    } catch (error) {
      if (i < retries - 1) {
        const delay = retryDelay * Math.pow(2, i);
        console.warn(
          `Attempt ${i + 1} failed for ${url}. Retrying in ${delay}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.error(`All ${retries} attempts failed for ${url}.`);
        throw error;
      }
    }
  }
};

export default pageScraper;
