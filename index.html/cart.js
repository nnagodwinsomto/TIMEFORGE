// cart.js - robust, defensive cart handling + WhatsApp checkout
(function () {
    'use strict';
  
    const WA_NUMBER = "2348066775722"; // your WhatsApp number in international format
  
    function log(...a){ console.log("[cart.js]", ...a); }
    function warn(...a){ console.warn("[cart.js]", ...a); }
    function err(...a){ console.error("[cart.js]", ...a); }
  
    function formatNaira(n){
      const num = Number(n) || 0;
      return num.toLocaleString();
    }
  
    // Safe localStorage parsing
    function loadCart() {
      try {
        const raw = localStorage.getItem("cart");
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
          warn("cart in localStorage is not an array — resetting.");
          return [];
        }
        return parsed.map(item => {
          // normalize shape
          return {
            key: item.key || null,
            name: item.name || "Item",
            priceNaira: Number(item.priceNaira) || 0,
            qty: Math.max(1, parseInt(item.qty, 10) || 1)
          };
        });
      } catch (e) {
        warn("Failed to parse cart from localStorage:", e);
        return [];
      }
    }
  
    function saveCart(cart) {
      try {
        localStorage.setItem("cart", JSON.stringify(cart));
      } catch (e) {
        warn("Failed to save cart to localStorage:", e);
      }
    }
  
    // small html-escape helper to avoid injection when rendering names
    function escapeHtml(s) {
      if (s == null) return "";
      return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }
  
    // Main logic after DOM ready
    document.addEventListener("DOMContentLoaded", function () {
      const cartItemsDiv = document.getElementById("cart-items");
      const cartTotalSpan = document.getElementById("cart-total");
      const checkoutBtn = document.getElementById("checkout-btn");
  
      if (!cartItemsDiv) warn("Missing element: #cart-items");
      if (!cartTotalSpan) warn("Missing element: #cart-total");
      if (!checkoutBtn) warn("Missing element: #checkout-btn");
  
      // load and normalize cart
      let cart = loadCart();
      // ensure it's an array
      if (!Array.isArray(cart)) cart = [];
  
      // Render cart into DOM
      function renderCart() {
        if (!cartItemsDiv) return;
        cartItemsDiv.innerHTML = ""; // reset
  
        if (!cart || cart.length === 0) {
          cartItemsDiv.innerHTML = "<p>Your cart is empty.</p>";
          if (cartTotalSpan) cartTotalSpan.textContent = "0";
          if (checkoutBtn) checkoutBtn.disabled = true;
          return;
        }
  
        if (checkoutBtn) checkoutBtn.disabled = false;
  
        let total = 0;
  
        cart.forEach(function (item, idx) {
          const qty = Number(item.qty) || 1;
          const unit = Number(item.priceNaira) || 0;
          const subtotal = qty * unit;
          total += subtotal;
  
          const wrapper = document.createElement("div");
          wrapper.className = "cart-item";
          wrapper.innerHTML = ''
            + '<p><strong>' + escapeHtml(item.name) + '</strong></p>'
            + '<p>₦' + formatNaira(unit) + ' × ' + qty + ' = ₦' + formatNaira(subtotal) + '</p>'
            + '<div class="cart-actions">'
            + '  <button data-action="dec" data-idx="' + idx + '">-</button>'
            + '  <button data-action="inc" data-idx="' + idx + '">+</button>'
            + '  <button data-action="remove" data-idx="' + idx + '">Remove</button>'
            + '</div>';
  
          cartItemsDiv.appendChild(wrapper);
        });
  
        if (cartTotalSpan) cartTotalSpan.textContent = formatNaira(total);
      }
  
      function persistAndRender() {
        saveCart(cart);
        renderCart();
      }
  
      // Event delegation for cart actions
      if (cartItemsDiv) {
        cartItemsDiv.addEventListener("click", function (e) {
          try {
            const btn = e.target.closest("button");
            if (!btn) return;
            const idxAttr = btn.getAttribute("data-idx");
            const action = btn.getAttribute("data-action");
            if (idxAttr === null) return;
  
            const idx = parseInt(idxAttr, 10);
            if (Number.isNaN(idx) || idx < 0 || idx >= cart.length) {
              warn("Invalid index on cart button:", idx);
              return;
            }
  
            if (action === "inc") {
              cart[idx].qty = (Number(cart[idx].qty) || 1) + 1;
            } else if (action === "dec") {
              cart[idx].qty = Math.max(1, (Number(cart[idx].qty) || 1) - 1);
            } else if (action === "remove") {
              cart.splice(idx, 1);
            } else {
              // unknown action
              return;
            }
  
            persistAndRender();
          } catch (ex) {
            err("Error handling cart button click:", ex);
          }
        });
      }
  
      // Checkout handler (WhatsApp)
      if (checkoutBtn) {
        checkoutBtn.addEventListener("click", function () {
          try {
            cart = loadCart(); // fresh read
            if (!cart || cart.length === 0) {
              alert("Your cart is empty.");
              return;
            }
  
            let total = 0;
            let msg = "Hi, I would like to purchase:\n";
  
            cart.forEach(function (item) {
              const qty = Number(item.qty) || 1;
              const price = Number(item.priceNaira) || 0;
              const subtotal = qty * price;
              total += subtotal;
              msg += "- " + (item.name || "Item") + " x" + qty + " (₦" + formatNaira(subtotal) + ")\n";
            });
  
            msg += "Total: ₦" + formatNaira(total) + "\n\nName:\nPhone:";
  
            const waUrl = "https://wa.me/" + encodeURIComponent(WA_NUMBER) + "?text=" + encodeURIComponent(msg);
            window.open(waUrl, "_blank");
          } catch (ex) {
            err("Checkout failed:", ex);
            alert("Unable to open WhatsApp. Check console for details.");
          }
        });
      }
  
      // initial render
      renderCart();
    });
  })();