import extractLinks from "../utils/datautils/extractLinks.js";
import linkFilter from "../utils/functions/linkFilter.js";

const searchUrls = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: "Missing query" });
    }

    const linksObj = await extractLinks(q);

    const allUrls = [];
    for (const provider of Object.keys(linksObj || {})) {
      const urls = Array.isArray(linksObj[provider]) ? linksObj[provider] : [];
      for (const url of urls) {
        const u = typeof url === "string" ? url.trim() : "";
        if (u) allUrls.push(u);
      }
    }

    const filtered = linkFilter(allUrls);

    return res.status(200).json({ message: "Ok", urls: filtered });
  } catch (err) {
    console.error("Error in searchUrls:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export default searchUrls;
