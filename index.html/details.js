'use strict';

// ---------- CONFIG ----------
const NAIRA_TO_USD = 1600; // adjust if needed
const LOG_PREFIX = '[details]';

const products = {
  casio:  { name:"Casio Classic",       priceNaira:55000,  description:"Timeless Casio — lightweight, reliable and great for everyday wear.", image:"images/casio.jpg" },
  gshock: { name:"G-Shock Explorer",    priceNaira:45000,  description:"Rugged G-Shock built to take shocks, water and adventures.", image:"images/gshock.jpg.JPG" },
  navi:   { name:"NaviForce Sport",     priceNaira:75000,  description:"Sporty NaviForce — precise, durable and stylish for active days.", image:"images/Navi.jpg" },
  patek:  { name:"Patek Elegance",      priceNaira:85000,  description:"Refined Patek-style design with dressy details and presence.", image:"images/patek.1.jpg" },
  rewa:   { name:"Reward VIP",          priceNaira:65000,  description:"Reward VIP — attention-grabbing look with premium finishes.", image:"images/rewa.jpg.JPG" },
  rolex:  { name:"Rolex Prestige",      priceNaira:250000, description:"Rolex-level styling that signals craftsmanship and status.", image:"images/rolex.jpg.JPG" },
  smart:  { name:"Smart Watch HR12",    priceNaira:40000,  description:"HR12 Smart — notifications, health tracking and modern looks.", image:"images/smart.jpg.JPG" }
};

// ---------- helpers ----------
function debugLog(...args){ console.log(LOG_PREFIX, ...args); }
function debugWarn(...args){ console.warn(LOG_PREFIX, ...args); }
function safeParseCart(){ 
  try { 
    const r = localStorage.getItem('cart'); 
    return r ? JSON.parse(r) : []; 
  } catch(e){ 
    debugWarn('cart parse failed', e); 
    return []; 
  } 
}
function safeSaveCart(cart){ 
  try { 
    localStorage.setItem('cart', JSON.stringify(cart)); 
  } catch(e){ 
    debugWarn('cart save failed', e); 
  } 
}
function formatNaira(n){ return Number(n).toLocaleString(); }
function showMessage(text){
  const el = document.getElementById('message');
  if(!el) { alert(text); return; }
  el.textContent = text;
  el.style.display = 'block';
  setTimeout(()=>{ el.style.display='none'; }, 1600);
}

// ---------- Cart handling ----------
function addToCart(key){
  if(!key || !products[key]) { 
    debugWarn('addToCart: invalid key', key); 
    alert('Cannot add: product not found.'); 
    return; 
  }

  // --- existing cart logic ---
  const cart = safeParseCart();
  const existing = cart.find(i => i.key === key);
  if(existing) {
    existing.qty = (existing.qty || 1) + 1;
  } else {
    cart.push({ key, name: products[key].name, priceNaira: products[key].priceNaira, qty: 1 });
  }
  safeSaveCart(cart);
  showMessage(products[key].name + ' added to cart');
  debugLog('cart now', cart);

  // --- Cart animation & count update ---
  const cartIcon = document.getElementById("cart-icon");
  const countSpan = document.getElementById("cart-count");

  if(cartIcon && countSpan){
    // update total quantity
    const totalQty = cart.reduce((sum, item) => sum + (item.qty || 0), 0);
    countSpan.textContent = totalQty;

    // trigger bounce animation
    cartIcon.classList.add("bounce");
    setTimeout(() => {
      cartIcon.classList.remove("bounce");
    }, 500);
  }
}
window.addToCart = addToCart;

// ---------- Populate page ----------
document.addEventListener('DOMContentLoaded', function(){
  const q = new URLSearchParams(location.search);
  const key = q.get('product');
  debugLog('URL product key:', key);

  const nameEl = document.getElementById('product-name');
  const descEl = document.getElementById('product-description');
  const nairaEl = document.getElementById('product-price-naira');
  const usdEl = document.getElementById('product-price-usd');
  const imgEl = document.getElementById('product-image');
  const addBtn = document.getElementById('add-to-cart-btn');
  const debugArea = document.getElementById('debug-area');

  if(!key || !products[key]){
    if(nameEl) nameEl.textContent = 'Product not found';
    if(descEl) descEl.textContent = 'Use ?product=casio or gshock or navi, etc.';
    if(imgEl) imgEl.style.display = 'none';
    debugWarn('Invalid product key:', key);
    if(debugArea) debugArea.textContent = 'DEBUG: Invalid key';
    return;
  }

  const p = products[key];
  if(nameEl) nameEl.textContent = p.name;
  if(descEl) descEl.textContent = p.description;
  if(nairaEl) nairaEl.textContent = formatNaira(p.priceNaira);
  if(usdEl) usdEl.textContent = (p.priceNaira / NAIRA_TO_USD).toFixed(2);
  if(imgEl){ 
    imgEl.src = p.image; 
    imgEl.alt = p.name; 
  }

  if(addBtn){
    addBtn.addEventListener('click', function(){ addToCart(key); });
  }

  if(debugArea){
  }
});
