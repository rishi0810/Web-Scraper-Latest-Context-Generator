import extractLinks from "../utils/datautils/extractLinks.js";
import {
  filterLinksByDomain,
  normalizeDomain,
} from "../utils/functions/domainFilter.js";
import linkFilter from "../utils/functions/linkFilter.js";

const searchUrls = async (req, res) => {
  try {
    const { query, q, domains } = req.body || {};
    const searchString = query || q;

    if (!searchString) {
      return res.status(400).json({ message: "Missing query" });
    }

    let cleanQ = searchString.trim();
    let requestedDomains = [];

    if (domains) {
      requestedDomains = Array.isArray(domains) ? domains : [domains];
    }

    let normalizedDomains = requestedDomains
      .map((d) => (typeof d === "string" ? normalizeDomain(d) : ""))
      .filter(Boolean);

    if (requestedDomains.length > 0 && normalizedDomains.length !== requestedDomains.length) {
      return res.status(400).json({
        message: "Invalid domain(s) in list. Use hostnames such as example.com.",
      });
    }

    // Support extracting site:domain from query string if domains list is empty
    const siteMatch = cleanQ.match(/(?:^|\s)site:([^\s]+)/i);
    if (siteMatch) {
      const extracted = normalizeDomain(siteMatch[1]);
      if (extracted) {
        if (!normalizedDomains.includes(extracted)) {
          normalizedDomains.push(extracted);
        }
      }
      cleanQ = cleanQ.replace(/(?:^|\s)site:[^\s]+/i, "").trim();
    }

    if (normalizedDomains.length === 0) {
      const linksObj = await extractLinks(cleanQ);
      return res.status(200).json({
        query: cleanQ,
        startpage: linkFilter(linksObj.startpage || []),
        bing: linkFilter(linksObj.bing || []),
        yahoo: linkFilter(linksObj.yahoo || []),
      });
    }

    const results = await Promise.all(
      normalizedDomains.map(async (domain) => {
        const searchQuery = `${cleanQ} site:${domain}`;
        const linksObj = await extractLinks(searchQuery);

        return {
          startpage: filterLinksByDomain(
            linkFilter(linksObj.startpage || []),
            domain,
          ),
          bing: filterLinksByDomain(
            linkFilter(linksObj.bing || []),
            domain,
          ),
          yahoo: filterLinksByDomain(
            linkFilter(linksObj.yahoo || []),
            domain,
          ),
        };
      })
    );

    const startpageMerged = [...new Set(results.flatMap((r) => r.startpage))];
    const bingMerged = [...new Set(results.flatMap((r) => r.bing))];
    const yahooMerged = [...new Set(results.flatMap((r) => r.yahoo))];

    return res.status(200).json({
      query: cleanQ,
      domains: normalizedDomains,
      startpage: startpageMerged,
      bing: bingMerged,
      yahoo: yahooMerged,
    });
  } catch (err) {
    console.error("Error in searchUrls:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export default searchUrls;
