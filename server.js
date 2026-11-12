import express from "express";
import { configDotenv } from "dotenv";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { readFileSync } from "fs";
import limit from "./utils/functions/rateLimit.js";
import pageParse from "./controllers/pageParse.js";
import rawDump from "./controllers/rawDump.js";
import imageParse from "./controllers/imageParse.js";
import imagesDump from "./controllers/imagesDump.js";
import searchUrls from "./controllers/searchUrls.js";

configDotenv();

const swaggerDocument = JSON.parse(
  readFileSync(new URL("./swagger.json", import.meta.url))
);

const app = express();
const port = process.env.PORT || 8080;

app.set("trust proxy", 1);

app.use(express.json());
app.use(cors());
app.use(
  ["/api/parse", "/api/scrape", "/api/image", "/api/images", "/api/search"],
  limit,
);

app.get("/api/health", (req, res) => {
  return res.status(200).send("Ok");
});

app.get("/api/parse", pageParse);
app.get("/api/scrape", rawDump);
app.get("/api/image", imageParse);
app.get("/api/images", imagesDump);
app.post("/api/search", searchUrls);

// Edge (Vercel CDN) caches assets for 365 days; browsers always revalidate.
app.use(
  [
    "/swagger-ui.css",
    "/swagger-ui-bundle.js",
    "/swagger-ui-standalone-preset.js",
    "/swagger-ui-init.js",
  ],
  (req, res, next) => {
    res.set("Cache-Control", "public, max-age=0, must-revalidate");
    res.set("Vercel-CDN-Cache-Control", "public, s-maxage=31536000");
    next();
  },
);
app.use("/", swaggerUi.serve);
app.get(
  "/",
  (req, res, next) => {
    // Edge (Vercel CDN) caches for 365 days; browsers always revalidate.
    res.set("Cache-Control", "public, max-age=0, must-revalidate");
    res.set("Vercel-CDN-Cache-Control", "public, s-maxage=31536000");
    next();
  },
  swaggerUi.setup(swaggerDocument),
);

app.listen(port, () => {});
