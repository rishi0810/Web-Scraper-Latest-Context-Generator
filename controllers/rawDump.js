import buildRawDump from "../utils/datautils/buildRawDump.js";

const rawDump = async (req, res) => {
  try {
    const { q } = req.query;

    const data = await buildRawDump(q);

    return res.status(200).json({ message: "Ok", data });
  } catch (err) {
    console.error("Error in rawDump:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export default rawDump;
