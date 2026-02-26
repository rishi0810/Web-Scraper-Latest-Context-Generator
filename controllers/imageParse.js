import imageExtractor from "../utils/datautils/imageExtractor.js";

const imageParse = async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) return res.status(400).json({ message: "Missing URL" });

    const images = await imageExtractor(url);
    return res.status(200).json({ url, images });
  } catch (err) {
    console.error("Error in imageParse:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export default imageParse;
