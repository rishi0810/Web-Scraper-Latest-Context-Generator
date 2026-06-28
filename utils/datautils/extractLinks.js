import fetchFromBing from "../linksutil/fetchFromBing.js";
import fetchFromStartPage from "../linksutil/fetchFromStartpage.js";
import fetchFromYahoo from "../linksutil/fetchFromYahoo.js";
import normalizeQuery from "../functions/normalizeQuery.js";

const fetchWithLog = async (name, fetchFn, query) => {
  try {
    const links = await fetchFn(query);
    console.log(`[${name}] query="${query}" => ${links.length} links`);
    if (links.length > 0) {
      links.forEach((l, idx) => console.log(`  ${idx + 1}: ${l}`));
    }
    return links;
  } catch (err) {
    console.error(`[${name}] query="${query}" => FAILED: ${err.message}`);
    return [];
  }
};

const extractLinks = async (query) => {
  if (!query) return {};

  let q = query;
  let domain = "";

  const siteMatch = query.match(/(?:^|\s)site:([^\s]+)/i);
  if (siteMatch) {
    domain = siteMatch[1];
    q = query.replace(/(?:^|\s)site:[^\s]+/i, "").trim();
  }

  const finalQuery = normalizeQuery(q);

  let yahooQuery = finalQuery;
  let startpageQuery = finalQuery;
  let bingQuery = finalQuery;

  if (domain) {
    yahooQuery = `${finalQuery} site:${domain}`;
    startpageQuery = `${finalQuery} SITE:${domain}`; // Uppercase SITE: avoids captcha on Startpage
    bingQuery = `${finalQuery} ${domain}`; // Plain text domain avoids captcha on Bing
  }

  console.log(
    `[extractLinks] Starting search: q="${finalQuery}", domain="${domain || "none"}"`,
  );

  const [bingLinks, yahooLinks, startpageLinks] = await Promise.all([
    fetchWithLog("Bing", fetchFromBing, bingQuery),
    fetchWithLog("Yahoo", fetchFromYahoo, yahooQuery),
    fetchWithLog("Startpage", fetchFromStartPage, startpageQuery),
  ]);

  const total = bingLinks.length + yahooLinks.length + startpageLinks.length;
  console.log(`[extractLinks] Total links across all engines: ${total}`);

  return {
    bing: bingLinks,
    yahoo: yahooLinks,
    startpage: startpageLinks,
  };
};

export default extractLinks;
