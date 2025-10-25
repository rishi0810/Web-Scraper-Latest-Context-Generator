import express from "express";
import { configDotenv } from "dotenv";
import cors from "cors";
import limit from "./utils/functions/rateLimit.js";
import pageParse from "./controllers/pageParse.js";
import rawDump from "./controllers/rawDump.js";

configDotenv();

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());
app.use(["/api/parse", "/api/scrape"], limit);

app.get("/api/health", (req, res) => {
  return res.status(200).send("Ok");
});

app.get("/api/parse", pageParse);
app.get("/api/scrape", rawDump);

app.listen(port, () => {});
