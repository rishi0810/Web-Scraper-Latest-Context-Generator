import extractLinks from "./extractLinks.js";
import pageScraper from "./pageScraper.js";
import linkFilter from "../functions/linkFilter.js";

const buildRawDump = async (query) => {
  if (!query || typeof query !== "string") return [];

  const linksObj = await extractLinks(query);

  const providerMap = {};
  const allUrls = [];
  const providers = Object.keys(linksObj || {});
  for (const provider of providers) {
    const urls = Array.isArray(linksObj[provider]) ? linksObj[provider] : [];
    for (const url of urls) {
      const u = typeof url === "string" ? url.trim() : url;
      if (!u) continue;
      if (!(u in providerMap)) {
        providerMap[u] = provider;
        allUrls.push(u);
      }
    }
  }

  const filtered = linkFilter(allUrls);

  const entries = filtered.map((url) => ({
    url,
    search_engine: providerMap[url] || "unknown",
  }));
  const concurrency = 5;
  const results = [];
  let idx = 0;

  const worker = async () => {
    while (idx < entries.length) {
      const i = idx++;
      const { url, search_engine } = entries[i];
      try {
        const raw = await pageScraper(url);
        results[i] = { url, search_engine, raw_data: raw };
      } catch (err) {
        console.warn(`Failed to scrape ${url}: ${err.message || err}`);
        results[i] = { url, search_engine, raw_data: "" };
      }
    }
  };

  const workers = Array.from(
    { length: Math.min(concurrency, entries.length) },
    () => worker(),
  );
  await Promise.all(workers);

  return results.filter(Boolean);
};

export default buildRawDump;
