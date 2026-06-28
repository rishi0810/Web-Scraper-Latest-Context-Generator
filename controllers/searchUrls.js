import extractLinks from "../utils/datautils/extractLinks.js";
import {
  filterLinksByDomain,
  normalizeDomain,
} from "../utils/functions/domainFilter.js";
import linkFilter from "../utils/functions/linkFilter.js";

const searchUrls = async (req, res) => {
  try {
    const { q, domain: domainParam, site } = req.query;

    if (!q) {
      return res.status(400).json({ message: "Missing query" });
    }

    let requestedDomain = domainParam || site;
    let cleanQ = q.trim();

    const siteMatch = cleanQ.match(/(?:^|\s)site:([^\s]+)/i);
    if (siteMatch) {
      if (!requestedDomain) {
        requestedDomain = siteMatch[1];
      }
      cleanQ = cleanQ.replace(/(?:^|\s)site:[^\s]+/i, "").trim();
    }

    const domain = requestedDomain ? normalizeDomain(requestedDomain) : "";

    if (requestedDomain && !domain) {
      return res.status(400).json({
        message: "Invalid domain. Use a hostname such as example.com.",
      });
    }

    const searchQuery = domain ? `${cleanQ} site:${domain}` : cleanQ;
    const linksObj = await extractLinks(searchQuery);

    const startpageFiltered = filterLinksByDomain(
      linkFilter(linksObj.startpage || []),
      domain,
    );
    const bingFiltered = filterLinksByDomain(
      linkFilter(linksObj.bing || []),
      domain,
    );
    const yahooFiltered = filterLinksByDomain(
      linkFilter(linksObj.yahoo || []),
      domain,
    );

    return res.status(200).json({
      query: cleanQ,
      ...(domain ? { domain } : {}),
      startpage: startpageFiltered,
      bing: bingFiltered,
      yahoo: yahooFiltered,
    });
  } catch (err) {
    console.error("Error in searchUrls:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export default searchUrls;
