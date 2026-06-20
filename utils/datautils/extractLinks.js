import fetchFromBing from "../linksutil/fetchFromBing.js";
import fetchFromStartPage from "../linksutil/fetchFromStartpage.js";
import fetchFromYahoo from "../linksutil/fetchFromYahoo.js";
import normalizeQuery from "../functions/normalizeQuery.js";

const extractLinks = async (query) => {
  if (!query) return {};
  const finalQuery = normalizeQuery(query);
  const bingLinks = await fetchFromBing(finalQuery);
  const yahooLinks = await fetchFromYahoo(finalQuery);
  const startpageLinks = await fetchFromStartPage(finalQuery);

  return {
    bing: bingLinks,
    yahoo: yahooLinks,
    startpage: startpageLinks,
  };
};

export default extractLinks;
