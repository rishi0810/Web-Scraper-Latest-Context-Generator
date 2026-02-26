import axios from "axios";
import * as cheerio from "cheerio";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";
import iconv from "iconv-lite";

/**
 * Fetches a page and extracts all image sources from the HTML.
 * Resolves relative URLs against the page's base URL.
 *
 * @param {string} url - The page URL to extract images from.
 * @param {object} [options={}]
 * @param {number} [options.retries=2]
 * @param {number} [options.retryDelay=100]
 * @param {object} [options.headers]
 * @param {CookieJar} [options.cookieJar]
 * @returns {Promise<string[]>} - Array of absolute image URLs.
 */
const imageExtractor = async (url, options = {}) => {
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

      const images = [];
      const seen = new Set();

      $("img").each((_, el) => {
        // Prefer srcset's first entry, data-src, then src
        const src =
          $(el).attr("src") ||
          $(el).attr("data-src") ||
          $(el).attr("data-lazy-src");

        if (!src) return;

        let resolved;
        try {
          resolved = new URL(src, url).href;
        } catch {
          // Skip malformed URLs
          return;
        }

        // Deduplicate
        if (seen.has(resolved)) return;
        seen.add(resolved);

        images.push(resolved);
      });

      // Also check <source> inside <picture> elements
      $("picture source").each((_, el) => {
        const srcset = $(el).attr("srcset");
        if (!srcset) return;

        // Take the first URL from the srcset
        const firstEntry = srcset.split(",")[0].trim().split(/\s+/)[0];
        if (!firstEntry) return;

        let resolved;
        try {
          resolved = new URL(firstEntry, url).href;
        } catch {
          return;
        }

        if (seen.has(resolved)) return;
        seen.add(resolved);
        images.push(resolved);
      });

      // Check for Open Graph image meta tags
      const ogImage = $('meta[property="og:image"]').attr("content");
      if (ogImage) {
        let resolved;
        try {
          resolved = new URL(ogImage, url).href;
        } catch {
          /* skip */
        }
        if (resolved && !seen.has(resolved)) {
          seen.add(resolved);
          images.push(resolved);
        }
      }

      return images;
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

export default imageExtractor;
