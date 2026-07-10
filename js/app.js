// NOTE: SECTIONS, formatNaira, escapeHtml come from js/shared.js (loaded before this file)

let ALL_PRODUCTS = [];
let ACTIVE_SECTION = "all";
let cart = JSON.parse(localStorage.getItem("hm_cart") || "[]");

// ---------- Load products from Supabase ----------
async function loadProducts() {
  const grid = document.getElementById("product-grid");
  grid.innerHTML = `<p class="empty-state">Loading products…</p>`;

  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .eq("in_stock", true)
    .order("created_at", { ascending: false });

  if (error) {
    grid.innerHTML = `<p class="empty-state">Couldn't load products right now. Please refresh.</p>`;
    console.error(error);
    return;
  }

  ALL_PRODUCTS = data || [];
  renderProducts();
}

function renderProducts() {
  const grid = document.getElementById("product-grid");
  const list = ACTIVE_SECTION === "all"
    ? ALL_PRODUCTS
    : ALL_PRODUCTS.filter(p => p.section === ACTIVE_SECTION);

  if (list.length === 0) {
    grid.innerHTML = `<p class="empty-state">No products here yet — check back soon!</p>`;
    return;
  }

  grid.innerHTML = list.map(productCard).join("");
  updateProductBadges();
}

function productCard(p) {
  const hasDiscount = p.discount && p.discount > 0;
  const finalPrice = hasDiscount ? p.price - (p.price * p.discount / 100) : p.price;
  const metaBits = [p.size, p.color, p.material, p.design, p.style].filter(Boolean).join(" · ");
  const imgUrl = p.image_url || 'assets/logo.png';

  return `
    <div class="product-card">
      <img class="product-img" src="${imgUrl}" alt="${escapeHtml(p.name)}" loading="lazy" onclick="openLightbox('${imgUrl}')">
      <div class="product-info">
        <div class="product-name">${escapeHtml(p.name)}</div>
        ${metaBits ? `<div class="product-meta" title="${escapeHtml(metaBits)}">${escapeHtml(metaBits)}</div>` : ""}
        <div class="price-row">
          <span class="price-now">₦${formatNaira(finalPrice)}</span>
          ${hasDiscount ? `<span class="price-old">₦${formatNaira(p.price)}</span><span class="discount-badge">-${p.discount}%</span>` : ""}
        </div>
        <div class="product-actions">
          <a class="icon-btn whatsapp" title="Order via WhatsApp" target="_blank" href="${whatsappLink(p, finalPrice)}">💬</a>
          <button class="icon-btn cart" title="Add to cart" onclick="addToCart('${p.id}')">
            🛒
            <span class="qty-badge" id="qty-badge-${p.id}"></span>
          </button>
        </div>
      </div>
    </div>
  `;
}

function whatsappLink(p, finalPrice) {
  const lines = [`Assalamu alaikum! I'd like to order:`, ``, `*${p.name}*`];

  const sectionLabel = SECTIONS[p.section]?.label;
  if (sectionLabel) lines.push(`Category: ${sectionLabel}`);
  if (p.size) lines.push(`Size: ${p.size}`);
  if (p.color) lines.push(`Color: ${p.color}`);
  if (p.material) lines.push(`Material: ${p.material}`);
  if (p.design) lines.push(`Design: ${p.design}`);
  if (p.style) lines.push(`Style: ${p.style}`);

  if (p.discount && p.discount > 0) {
    lines.push(`Price: ₦${formatNaira(finalPrice)} (was ₦${formatNaira(p.price)}, -${p.discount}%)`);
  } else {
    lines.push(`Price: ₦${formatNaira(finalPrice)}`);
  }

  lines.push(``, `Is it available?`);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
}

// ---------- Image lightbox ----------
function openLightbox(url) {
  document.getElementById("lightbox-img").src = url;
  document.getElementById("lightbox-overlay").classList.add("open");
}

function closeLightbox() {
  document.getElementById("lightbox-overlay").classList.remove("open");
}

// ---------- Category filter ----------
function initCategoryBadges() {
  document.querySelectorAll(".cat-badge").forEach(badge => {
    badge.addEventListener("click", () => {
      document.querySelectorAll(".cat-badge").forEach(b => b.classList.remove("active"));
      badge.classList.add("active");
      ACTIVE_SECTION = badge.dataset.section;
      renderProducts();
      document.getElementById("catalog").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

// ---------- Cart ----------
function saveCart() {
  localStorage.setItem("hm_cart", JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const count = cart.reduce((sum, i) => sum + i.qty, 0);
  document.getElementById("cart-count").textContent = count;
  updateProductBadges();
}

function updateProductBadges() {
  document.querySelectorAll(".qty-badge").forEach(badge => {
    const id = badge.id.replace("qty-badge-", "");
    const item = cart.find(i => i.id === id);
    if (item && item.qty > 0) {
      badge.textContent = item.qty;
      badge.classList.add("show");
    } else {
      badge.textContent = "";
      badge.classList.remove("show");
    }
  });
}

function addToCart(productId) {
  const product = ALL_PRODUCTS.find(p => p.id === productId);
  if (!product) return;
  const existing = cart.find(i => i.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    const hasDiscount = product.discount && product.discount > 0;
    const finalPrice = hasDiscount ? product.price - (product.price * product.discount / 100) : product.price;
    cart.push({ id: product.id, name: product.name, price: finalPrice, image: product.image_url, qty: 1 });
  }
  saveCart();
  renderCart();
  showToast(`${product.name} added to cart`);
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
  saveCart();
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
  renderCart();
}

function cartTotal() {
  return cart.reduce((sum, i) => sum + i.price * i.qty, 0);
}

function cartWhatsappLink() {
  if (cart.length === 0) {
    return `https://wa.me/${WHATSAPP_NUMBER}`;
  }
  const lines = [`Assalamu alaikum! I'd like to order the following:`, ``];
  cart.forEach((item, i) => {
    const subtotal = item.price * item.qty;
    lines.push(`${i + 1}. ${item.name} x${item.qty} — ₦${formatNaira(subtotal)}`);
  });
  lines.push(``, `*Total: ₦${formatNaira(cartTotal())}*`, ``, `Can we proceed?`);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
}

function renderCart() {
  const container = document.getElementById("cart-items");
  if (cart.length === 0) {
    container.innerHTML = `<p class="empty-state">Your cart is empty</p>`;
  } else {
    container.innerHTML = cart.map(i => `
      <div class="cart-item">
        <img src="${i.image || 'assets/logo.png'}" alt="${escapeHtml(i.name)}">
        <div class="cart-item-info">
          <div class="name">${escapeHtml(i.name)}</div>
          <div class="price">₦${formatNaira(i.price * i.qty)}</div>
          <div class="qty-controls">
            <button onclick="changeQty('${i.id}', -1)">−</button>
            <span>${i.qty}</span>
            <button onclick="changeQty('${i.id}', 1)">+</button>
          </div>
          <div class="remove-item" onclick="removeFromCart('${i.id}')">Remove</div>
        </div>
      </div>
    `).join("");
  }
  document.getElementById("cart-total").textContent = `₦${formatNaira(cartTotal())}`;
  document.getElementById("cart-whatsapp").href = cartWhatsappLink();
}

function toggleCart(open) {
  document.getElementById("cart-overlay").classList.toggle("open", open);
  document.getElementById("cart-drawer").classList.toggle("open", open);
}

// ---------- Checkout ----------
function openCheckout() {
  if (cart.length === 0) return;
  toggleCart(false);
  document.getElementById("checkout-modal").classList.add("open");
}

function closeCheckout() {
  document.getElementById("checkout-modal").classList.remove("open");
}

async function submitCheckout(e) {
  e.preventDefault();
  const form = e.target;
  const email = form.email.value.trim();
  const name = form.name.value.trim();
  const phone = form.phone.value.trim();
  const address = form.address.value.trim();
  const total = cartTotal();

  if (!window.PaystackPop || PAYSTACK_PUBLIC_KEY.includes("YOUR_")) {
    showToast("Online payment isn't set up yet — please use WhatsApp to order.");
    return;
  }

  const handler = PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email: email,
    amount: Math.round(total * 100), // kobo
    currency: "NGN",
    ref: "HM-" + Date.now(),
    metadata: {
      custom_fields: [
        { display_name: "Name", variable_name: "name", value: name },
        { display_name: "Phone", variable_name: "phone", value: phone },
        { display_name: "Address", variable_name: "address", value: address },
      ],
    },
    callback: function (response) {
      recordOrder({ name, phone, address, email, items: cart, total, ref: response.reference });
      cart = [];
      saveCart();
      renderCart();
      closeCheckout();
      showToast("Payment successful! We'll reach out to confirm delivery.");
    },
    onClose: function () {
      showToast("Checkout cancelled");
    },
  });
  handler.openIframe();
}

async function recordOrder(order) {
  const { error } = await supabaseClient.from("orders").insert([{
    customer_name: order.name,
    phone: order.phone,
    email: order.email,
    address: order.address,
    items: order.items,
    total: order.total,
    payment_ref: order.ref,
    status: "paid",
  }]);
  if (error) console.error("Order save failed:", error);
}

// ---------- Toast ----------
let toastTimer;
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

// ---------- Fixed header spacer ----------
function syncHeaderSpacer() {
  const header = document.querySelector(".site-header");
  const spacer = document.getElementById("header-spacer");
  if (header && spacer) spacer.style.height = header.offsetHeight + "px";
}

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", () => {
  initCategoryBadges();
  updateCartCount();
  renderCart();
  loadProducts();
  syncHeaderSpacer();
  window.addEventListener("resize", syncHeaderSpacer);
  window.addEventListener("load", syncHeaderSpacer);
  if (document.fonts) document.fonts.ready.then(syncHeaderSpacer);

  document.getElementById("cart-btn").addEventListener("click", () => toggleCart(true));
  document.getElementById("cart-close").addEventListener("click", () => toggleCart(false));
  document.getElementById("cart-overlay").addEventListener("click", () => toggleCart(false));
  document.getElementById("checkout-btn").addEventListener("click", openCheckout);
  document.getElementById("checkout-form").addEventListener("submit", submitCheckout);
  document.getElementById("checkout-close").addEventListener("click", closeCheckout);
  document.getElementById("lightbox-overlay").addEventListener("click", (e) => {
    if (e.target.id === "lightbox-overlay") closeLightbox();
  });
});
