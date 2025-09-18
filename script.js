// PakSar Seller - dynamic product loader + click tracking (client-side)
// IMPORTANT: Replace AFFILIATE_TAG with your real Amazon Associates tag (no spaces), e.g. PakSarSeller-20
const AFFILIATE_TAG = "PakSarSeller-20";

// Product dataset - add or edit products here
const products = [
  {asin:"B07PGL2ZSL", title:"Wireless Bluetooth Headphones - Over Ear", price:"$59.99", category:"Audio", image:"https://via.placeholder.com/600x400?text=Headphones"},
  {asin:"B08N5WRWNW", title:"RGB Mechanical Keyboard - Compact 75%", price:"$89.50", category:"Keyboards", image:"https://via.placeholder.com/600x400?text=Keyboard"},
  {asin:"B09F3F5X5C", title:"Smart Fitness Watch - Heart Rate", price:"$129.00", category:"Wearables", image:"https://via.placeholder.com/600x400?text=Smart+Watch"},
  {asin:"B0C12345EX", title:"4K Action Camera - Waterproof", price:"$199.99", category:"Cameras", image:"https://via.placeholder.com/600x400?text=Action+Camera"},
  {asin:"B0A98765YZ", title:"Noise Cancelling Earbuds - True Wireless", price:"$49.99", category:"Audio", image:"https://via.placeholder.com/600x400?text=Earbuds"},
  {asin:"B0912345UV", title:"Portable Bluetooth Speaker - Bass", price:"$39.95", category:"Audio", image:"https://via.placeholder.com/600x400?text=Speaker"},
  {asin:"B07YFZ8S6H", title:"USB-C Fast Charger 65W", price:"$24.99", category:"Accessories", image:"https://via.placeholder.com/600x400?text=Charger"},
  {asin:"B083K1QW3V", title:"Laptop Backpack - Anti-theft", price:"$49.00", category:"Bags", image:"https://via.placeholder.com/600x400?text=Backpack"},
  {asin:"B07XJ8C8F5", title:"Wireless Gaming Mouse", price:"$39.00", category:"Mice", image:"https://via.placeholder.com/600x400?text=Mouse"},
  {asin:"B08K2GW88C", title:"4K Monitor 27 inch", price:"$249.99", category:"Monitors", image:"https://via.placeholder.com/600x400?text=Monitor"},
  {asin:"B07HDBZN7Q", title:"External SSD 1TB", price:"$119.99", category:"Storage", image:"https://via.placeholder.com/600x400?text=SSD"},
  {asin:"B09D1G7G9Q", title:"Smart Home Plug - 2 Pack", price:"$22.50", category:"Smart Home", image:"https://via.placeholder.com/600x400?text=Smart+Plug"}
];

// Utility: build affiliate link
function buildAffiliateLink(asin){
  // ensure no spaces in tag
  const tag = encodeURIComponent(AFFILIATE_TAG.trim());
  return `https://www.amazon.com/dp/${asin}/?tag=${tag}`;
}

// Render categories
const categorySet = new Set(products.map(p=>p.category));
const categorySelect = document.getElementById('categorySelect');
categorySet.forEach(cat=>{
  const opt = document.createElement('option');
  opt.value = cat;
  opt.textContent = cat;
  categorySelect.appendChild(opt);
});

// Render products
const productsRow = document.getElementById('productsRow');
const noResults = document.getElementById('noResults');

function render(list){
  productsRow.innerHTML = '';
  if(!list.length){
    noResults.style.display = 'block';
    return;
  }
  noResults.style.display = 'none';
  list.forEach(p=>{
    const col = document.createElement('div');
    col.className = 'col-6 col-md-4 col-lg-3';
    col.innerHTML = `
      <article class="product-card">
        <img class="card-media" src="${p.image}" alt="${escapeHtml(p.title)}" loading="lazy">
        <div class="card-body-custom">
          <div class="card-title">${escapeHtml(p.title)}</div>
          <div class="card-meta">
            <span class="badge-cat">${escapeHtml(p.category)}</span>
            <span class="price">${escapeHtml(p.price)}</span>
          </div>
          <a class="btn-buy" href="${buildAffiliateLink(p.asin)}" target="_blank" rel="noopener noreferrer" data-asin="${p.asin}" data-title="${escapeHtml(p.title)}">Buy on Amazon</a>
        </div>
      </article>
    `;
    productsRow.appendChild(col);
  });
  // attach click tracking for visible buttons
  attachTracking();
}

// Basic XSS-safe escaping for text in the template above
function escapeHtml(str){
  return String(str).replace(/[&<>"'`=\/]/g, function(s){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#47;','`':'&#96;','=':'&#61;'}[s];
  });
}

// Search & category filter
const searchInput = document.getElementById('searchInput');
function filterAndRender(){
  const q = searchInput.value.trim().toLowerCase();
  const cat = categorySelect.value;
  const filtered = products.filter(p=>{
    const matchesQ = !q || (p.title+" "+p.asin+" "+p.category).toLowerCase().includes(q);
    const matchesCat = (cat === 'all') || (p.category === cat);
    return matchesQ && matchesCat;
  });
  render(filtered);
}

searchInput.addEventListener('input', filterAndRender);
categorySelect.addEventListener('change', filterAndRender);

// Tracking: store clicks locally and optionally send to webhook if configured
const TRACK_KEY = 'paksar_clicks_v1';
function getStoredClicks(){ try { return JSON.parse(localStorage.getItem(TRACK_KEY) || '[]'); } catch(e){ return []; } }
function storeClick(obj){
  const arr = getStoredClicks();
  arr.push(obj);
  try{ localStorage.setItem(TRACK_KEY, JSON.stringify(arr)); }catch(e){ console.warn('Could not store click', e); }
  // optional: send to webhook if set
  const webhook = localStorage.getItem('paksar_webhook_url');
  if(webhook){
    // be cautious: do a non-blocking fire-and-forget
    navigator.sendBeacon && navigator.sendBeacon(webhook, JSON.stringify(obj));
  }
}

// Attach click listeners to buy buttons (delegation not used so reattach after render)
function attachTracking(){
  document.querySelectorAll('.btn-buy').forEach(btn=>{
    btn.addEventListener('click', function(e){
      try{
        const asin = btn.getAttribute('data-asin') || '';
        const title = btn.getAttribute('data-title') || '';
        const t = new Date().toISOString();
        const payload = {
          asin, title, time: t, url: location.href, referrer: document.referrer || null, userAgent: navigator.userAgent
        };
        storeClick(payload);
      }catch(err){ console.warn('tracking failed', err); }
      // allow normal navigation to Amazon
    });
  });
}

// initial render
render(products);

// expose helper for admin page to read clicks
window._paksar_utils = {
  getClicks: getStoredClicks,
  clearClicks: ()=>{ localStorage.removeItem(TRACK_KEY); },
  setWebhook: (url)=>{ localStorage.setItem('paksar_webhook_url', url); },
  getWebhook: ()=>localStorage.getItem('paksar_webhook_url') || ''
};
