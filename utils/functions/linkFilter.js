const linkFilter = (links) => {
  const filtered = links.filter((link) => {
    return (
      link.startsWith("https") &&
      !link.includes("youtube") &&
      !link.includes("video.search.yahoo.com") &&
      !link.endsWith(".pdf") &&
      !link.endsWith(".docx")
    );
  });
  return [...new Set(filtered)];
};
export default linkFilter;
