import fetchFromBraveSearch from "../linksutil/fetchFromBraveSearch.js";
import fetchFromStartPage from "../linksutil/fetchFromStartpage.js";
import fetchFromYahoo from "../linksutil/fetchFromYahoo.js";
import normalizeQuery from "../functions/normalizeQuery.js";

const extractLinks = async (query) => {
  if (!query) return {};
  const finalQuery = normalizeQuery(query);
  const braveLinks = await fetchFromBraveSearch(finalQuery);
  const yahooLinks = await fetchFromYahoo(finalQuery);
  const startpageLinks = await fetchFromStartPage(finalQuery);

  return {
    brave: braveLinks,
    yahoo: yahooLinks,
    startpage: startpageLinks,
  };
};

export default extractLinks;
