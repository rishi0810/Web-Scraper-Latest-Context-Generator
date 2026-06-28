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

const swaggerCdnOptions = {
  customCssUrl: "https://unpkg.com/swagger-ui-dist@5/swagger-ui.css",
  customJs: [
    "https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js",
    "https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js",
  ],
};

app.use("/", swaggerUi.serve);
app.get("/", swaggerUi.setup(swaggerDocument, swaggerCdnOptions));

app.listen(port, () => {});
