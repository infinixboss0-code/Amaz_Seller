PakSar Seller - Static site (dynamic front-end)

Instructions:
1) Replace AFFILIATE_TAG in script.js with your real Amazon Associates tag (no spaces), e.g. PakSarSeller-20
2) To add/edit products, modify the `products` array in script.js (asin, title, price, category, image).
3) Upload all files to GitHub repo and deploy via Vercel or GitHub Pages.
4) Admin page (admin.html) allows viewing stored click events (stored in user's browser localStorage) and downloading CSV.
   For server-side tracking, set a webhook URL in admin page to forward clicks to your server endpoint.

Security & Notes:
- All affiliate links open with rel="noopener noreferrer" and target="_blank".
- Content-Security-Policy header added in index.html to restrict sources.
- Tracking is client-side only. To persist centrally, provide a webhook endpoint capable of receiving POSTs.

Generated: 2025-09-18T19:27:50.921907 UTC
