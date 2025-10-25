const normalizeQuery = (str) => {
  if (typeof str !== "string") return "";
  return str.trim().split(/\s+/).join("+");
};

export default normalizeQuery;
