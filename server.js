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

app.get("/", (req, res) => {
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Web Scraping Service API Documentation</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family:
          -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        line-height: 1.6;
        color: #333;
        background-color: #f8f9fa;
      }

      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }

      .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 40px 0;
        text-align: center;
        margin-bottom: 30px;
        border-radius: 8px;
      }

      .header h1 {
        font-size: 2.5rem;
        margin-bottom: 10px;
      }

      .header p {
        font-size: 1.1rem;
        opacity: 0.9;
      }

      .endpoint {
        background: white;
        border-radius: 8px;
        margin-bottom: 20px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      }

      .endpoint-header {
        padding: 20px;
        border-bottom: 1px solid #eee;
      }

      .method {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 4px;
        font-weight: bold;
        font-size: 0.8rem;
        margin-right: 10px;
      }

      .method.get {
        background-color: #49cc90;
        color: white;
      }

      .endpoint-path {
        font-family: "Courier New", monospace;
        font-size: 1.1rem;
        color: #333;
      }

      .endpoint-description {
        color: #666;
        margin-top: 8px;
      }

      .endpoint-body {
        padding: 20px;
      }

      .section {
        margin-bottom: 25px;
      }

      .section h4 {
        color: #555;
        margin-bottom: 10px;
        font-size: 1rem;
      }

      .params-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 15px;
      }

      .params-table th,
      .params-table td {
        padding: 10px;
        text-align: left;
        border-bottom: 1px solid #eee;
      }

      .params-table th {
        background-color: #f8f9fa;
        font-weight: 600;
      }

      .code-block {
        background-color: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 4px;
        padding: 15px;
        font-family: "Courier New", monospace;
        font-size: 0.9rem;
        overflow-x: auto;
      }

      .try-it-section {
        background-color: #f8f9fa;
        padding: 20px;
        border-radius: 4px;
        margin-top: 20px;
      }

      .input-group {
        margin-bottom: 15px;
      }

      .input-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: 600;
      }

      .input-group input {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 0.9rem;
      }

      .btn {
        background-color: #007bff;
        color: white;
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
        margin-right: 10px;
      }

      .btn:hover {
        background-color: #0056b3;
      }

      .response-area {
        margin-top: 15px;
        min-height: 100px;
        background-color: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 15px;
        font-family: "Courier New", monospace;
        font-size: 0.8rem;
        white-space: pre-wrap;
      }

      .status-code {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 3px;
        font-weight: bold;
        font-size: 0.8rem;
      }

      .status-200 {
        background-color: #d4edda;
        color: #155724;
      }

      .status-400 {
        background-color: #f8d7da;
        color: #721c24;
      }

      .status-500 {
        background-color: #f5c6cb;
        color: #721c24;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Web Scraping Service API</h1>
        <p>
          Extract and process web content with intelligent parsing and
          multi-search capabilities
        </p>
      </div>

      <div class="endpoint">
        <div class="endpoint-header">
          <span class="method get">GET</span>
          <span class="endpoint-path">/api/health</span>
          <div class="endpoint-description">
            Health check endpoint to verify service status
          </div>
        </div>
        <div class="endpoint-body">
          <div class="section">
            <h4>Response</h4>
            <div class="code-block">
              Status: <span class="status-code status-200">200 OK</span> Body:
              "Ok"
            </div>
          </div>

          <div class="try-it-section">
            <h4>Try it out</h4>
            <button class="btn" onclick="testHealth()">Send Request</button>
            <div id="health-response" class="response-area">
              Click "Send Request" to test the endpoint
            </div>
          </div>
        </div>
      </div>

      <div class="endpoint">
        <div class="endpoint-header">
          <span class="method get">GET</span>
          <span class="endpoint-path">/api/parse</span>
          <div class="endpoint-description">
            Extract main textual content from a single webpage
          </div>
        </div>
        <div class="endpoint-body">
          <div class="section">
            <h4>Parameters</h4>
            <table class="params-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Required</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>url</td>
                  <td>string</td>
                  <td>Yes</td>
                  <td>The URL of the webpage to parse</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="section">
            <h4>Response Examples</h4>
            <div class="code-block">
              Status: <span class="status-code status-200">200 OK</span> {
              "content": "This is the extracted main content from the
              webpage..." }
            </div>

            <div class="code-block">
              Status:
              <span class="status-code status-400">400 Bad Request</span> {
              "message": "Missing URL" }
            </div>
          </div>

          <div class="try-it-section">
            <h4>Try it out</h4>
            <div class="input-group">
              <label for="parse-url">URL:</label>
              <input
                type="text"
                id="parse-url"
                placeholder="https://example.com"
                value="https://example.com"
              />
            </div>
            <button class="btn" onclick="testParse()">Send Request</button>
            <div id="parse-response" class="response-area">
              Enter a URL and click "Send Request" to test
            </div>
          </div>
        </div>
      </div>

      <div class="endpoint">
        <div class="endpoint-header">
          <span class="method get">GET</span>
          <span class="endpoint-path">/api/scrape</span>
          <div class="endpoint-description">
            Search multiple engines and scrape content from result pages
          </div>
        </div>
        <div class="endpoint-body">
          <div class="section">
            <h4>Parameters</h4>
            <table class="params-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Required</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>q</td>
                  <td>string</td>
                  <td>Yes</td>
                  <td>Search query to find and scrape relevant pages</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="section">
            <h4>Response Examples</h4>
            <div class="code-block">
              Status: <span class="status-code status-200">200 OK</span> {
              "message": "Ok", "data": [ { "url": "https://example.com/page1",
              "search_engine": "brave", "raw_data": "Content from the scraped
              page..." }, { "url": "https://example.com/page2", "search_engine":
              "yahoo", "raw_data": "More content from another page..." } ] }
            </div>

            <div class="code-block">
              Status:
              <span class="status-code status-500"
                >500 Internal Server Error</span
              >
              { "error": "Internal server error" }
            </div>
          </div>

          <div class="try-it-section">
            <h4>Try it out</h4>
            <div class="input-group">
              <label for="scrape-query">Search Query:</label>
              <input
                type="text"
                id="scrape-query"
                placeholder="machine learning basics"
                value="machine learning"
              />
            </div>
            <button class="btn" onclick="testScrape()">Send Request</button>
            <div id="scrape-response" class="response-area">
              Enter a search query and click "Send Request" to test
            </div>
          </div>
        </div>
      </div>
    </div>

    <script>
      async function testHealth() {
          const responseDiv = document.getElementById('health-response');
          responseDiv.textContent = 'Loading...';

          try {
              const response = await fetch('/api/health');
              const text = await response.text();
              responseDiv.textContent = \`Status: \${response.status} \${response.statusText}\nBody: "\${text}"\`;
          } catch (error) {
              responseDiv.textContent = \`Error: \${error.message}\`;
          }
      }


      async function testParse() {
          const url = document.getElementById('parse-url').value;
          const responseDiv = document.getElementById('parse-response');

          if (!url) {
              responseDiv.textContent = 'Please enter a URL';
              return;
          }

          responseDiv.textContent = 'Loading...';

          try {
              const response = await fetch(\`/api/parse?url=\${encodeURIComponent(url)}\`);
              const data = await response.json();
              responseDiv.textContent = \`Status: \${response.status} \${response.statusText}\n\${JSON.stringify(data, null, 2)}\`;
          } catch (error) {
              responseDiv.textContent = \`Error: \${error.message}\`;
          }
      }

      async function testScrape() {
          const query = document.getElementById('scrape-query').value;
          const responseDiv = document.getElementById('scrape-response');

          if (!query) {
              responseDiv.textContent = 'Please enter a search query';
              return;
          }

          responseDiv.textContent = 'Loading... (This may take a while as it searches and scrapes multiple pages)';

          try {
              const response = await fetch(\`/api/scrape?q=\${encodeURIComponent(query)}\`);
              const data = await response.json();
              responseDiv.textContent = \`Status: \${response.status} \${response.statusText}\n\${JSON.stringify(data, null, 2)}\`;
          } catch (error) {
              responseDiv.textContent = \`Error: \${error.message}\`;
          }
      }
    </script>
  </body>
</html>
`;

  res.send(html);
});

app.get("/api/health", (req, res) => {
  return res.status(200).send("Ok");
});

app.get("/api/parse", pageParse);
app.get("/api/scrape", rawDump);

app.listen(port, () => {});
