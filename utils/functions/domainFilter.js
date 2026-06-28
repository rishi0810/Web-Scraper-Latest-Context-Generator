const normalizeDomain = (value) => {
  if (typeof value !== "string") return "";

  let candidate = value.trim().toLowerCase();
  if (!candidate) return "";

  candidate = candidate.replace(/^site:/, "");

  try {
    const url = new URL(
      candidate.includes("://") ? candidate : `https://${candidate}`,
    );

    if (
      url.username ||
      url.password ||
      url.port ||
      (url.pathname !== "/" && url.pathname !== "") ||
      url.search ||
      url.hash
    ) {
      return "";
    }

    let hostname = url.hostname.replace(/\.$/, "");
    hostname = hostname.replace(/^www\./, "");
    if (
      !hostname ||
      !hostname.includes(".") ||
      hostname.length > 253 ||
      !/^[a-z0-9.-]+$/.test(hostname) ||
      hostname.split(".").some((label) => {
        return (
          !label ||
          label.length > 63 ||
          label.startsWith("-") ||
          label.endsWith("-")
        );
      })
    ) {
      return "";
    }

    return hostname;
  } catch {
    return "";
  }
};

const filterLinksByDomain = (links, domain) => {
  if (!domain) return links;

  const cleanDomain = domain.toLowerCase().replace(/^www\./, "");

  return links.filter((link) => {
    try {
      let hostname = new URL(link).hostname.toLowerCase().replace(/\.$/, "");
      hostname = hostname.replace(/^www\./, "");
      return hostname === cleanDomain || hostname.endsWith(`.${cleanDomain}`);
    } catch {
      return false;
    }
  });
};

export { filterLinksByDomain, normalizeDomain };
