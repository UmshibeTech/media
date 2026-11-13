# Google Search Console Setup

Google Search Console is a free way to monitor how Google crawls and displays your website. It does not guarantee indexing, rankings, or enquiries.

## 1. Add and verify the site

1. Open [Google Search Console](https://search.google.com/search-console).
2. Add `https://www.mshibeweddingfilms.co.za/` as a URL-prefix property, or add the domain property if you can update DNS.
3. Complete one of Google's offered verification methods. For an HTML file or meta tag, deploy the supplied file or tag to the live website before clicking Verify. For a Domain property, add Google's DNS record at your domain provider.

## 2. Submit the sitemap

1. In Search Console, open **Sitemaps**.
2. Submit `https://www.mshibeweddingfilms.co.za/sitemap.xml`.
3. Check the submission status and resolve any reported errors.

The site is currently a single-page website. Its homepage is the only sitemap URL; section anchors such as `/#services` are not independent pages.

## 3. Inspect and monitor

- Use **URL Inspection** on the homepage to review Google's known status and, when available, request a crawl.
- Use the **Performance** report to see real impressions, clicks, queries, and average position after data accumulates.
- Use the **Indexing** reports to investigate pages Google could not index.
- Check **Core Web Vitals** reports for performance issues when data is available.

## Local visibility and reviews

If the business meets Google's eligibility requirements, create or claim a Google Business Profile with accurate contact and service-area details. Ask real past clients for honest reviews; do not write or offer incentives for reviews. Never add review ratings or testimonials to the site unless they are genuine and used with permission.

## Related files

- `robots.txt` allows crawling and points to the sitemap.
- `sitemap.xml` lists the canonical homepage.
- `index.html` contains the site's metadata and structured data.
