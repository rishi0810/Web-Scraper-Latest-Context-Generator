import pageScraper from "../utils/datautils/pageScraper.js";

const pageParse = async (req, res) => {
  const { url } = req.query;

  if (!url) return res.status(400).json({ message: "Missing URL" });

  const response = await pageScraper(url);
  return res.status(200).json({ content: response });
};

export default pageParse;
