# Web Scraping Service

Overview
--------
This project is a hosted web scraping service that extracts and consolidates textual content from web pages and search results. It exposes two purpose-built endpoints: one for extracting the primary content of a single page, and another for collecting and scraping results discovered across multiple search engines.

What the service does
---------------------
- Parse endpoint: Accepts a single URL and returns the main textual content of that page. The parser removes scripts, styles, iframes and other non-content elements, and attempts to identify the page's primary content container (for example, `main`, `article`, or the element with the most paragraph content).
- Scrape endpoint: Accepts a search query, queries multiple search engines (Brave, Yahoo, Startpage), aggregates unique result URLs, filters and normalizes them, then scrapes each target page to produce a raw content dump along with source metadata.

Key behaviors and features
-------------------------
- Robust extraction: Handles different character encodings and decodes content correctly before parsing.
- Heuristic content detection: Locates the best candidate element for main content using common tags, id/class heuristics, and fallback heuristics based on paragraph density.
- Retries and resilience: Implements configurable retry logic with exponential backoff for transient network failures.
- Concurrency control: Scrapes multiple targets in parallel with a bounded concurrency to balance throughput and stability.
- Rate limiting: Built-in request limiting to prevent abusive usage of hosted endpoints.
- Source attribution: For multi-search scraping, each scraped result includes the originating search provider so results can be traced back to the original source.

Input and output (behavioral summary)
-------------------------------------
- Parse endpoint input: a single URL.
- Parse endpoint output: a cleaned, consolidated text string representing the main page content.

- Scrape endpoint input: a search query string.
- Scrape endpoint output: an array of entries; each entry contains the URL, the search engine source, and the scraped text for that URL.

Operational notes
-----------------
- The service is designed to run as a hosted API and is not intended as a local CLI tool. It enforces request limits and basic protections suitable for a public-facing service.
- It focuses on extracting readable textual content rather than structured semantic extraction (no claim of perfect article segmentation, summarization, or NLP inference).

Privacy and limitations
----------------------
- The service retrieves publicly accessible pages only; it does not bypass authentication or access controls.
- Scraped content may include third-party text; downstream consumers are responsible for complying with applicable content, copyright, and terms-of-service restrictions.

Purpose
-------
The repository implements a focused hosted scraping utility intended to power content ingestion and indexing workflows by consolidating page-level text and search-result aggregations into a consistent, machine-friendly form.
