import extractLinks from "../utils/datautils/extractLinks.js";
import imageExtractor from "../utils/datautils/imageExtractor.js";
import linkFilter from "../utils/functions/linkFilter.js";

const imagesDump = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) return res.status(400).json({ message: "Missing search query" });

    const linksObj = await extractLinks(q);

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
          const images = await imageExtractor(url);
          results[i] = { url, search_engine, images };
        } catch (err) {
          console.warn(
            `Failed to extract images from ${url}: ${err.message || err}`,
          );
          results[i] = { url, search_engine, images: [] };
        }
      }
    };

    const workers = Array.from(
      { length: Math.min(concurrency, entries.length) },
      () => worker(),
    );
    await Promise.all(workers);

    return res
      .status(200)
      .json({ message: "Ok", data: results.filter(Boolean) });
  } catch (err) {
    console.error("Error in imagesDump:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export default imagesDump;
