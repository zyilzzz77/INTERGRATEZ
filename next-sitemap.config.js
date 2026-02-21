const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://inversave.space";

module.exports = {
  siteUrl,
  generateRobotsTxt: false,
  sitemapSize: 7000,
  exclude: ["/api/*"],
};
