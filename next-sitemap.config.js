/** @type {import('next-sitemap').IConfig} */

module.exports = {
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://quote.boplawnsandgardens.co.nz',
    generateRobotsTxt: true,
    sitemapSize: 1000,
    exclude: [ '/thank-you', '/order-received', '/checkout', '/form-submitted/thank-you'],
};
