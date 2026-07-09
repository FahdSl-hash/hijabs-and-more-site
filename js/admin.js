let editingId = null;

// ---------- Auth ----------
async function checkSession() {
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) {
    showAdminPanel();
  } else {
    showLogin();
  }
}

function showLogin() {
  document.getElementById("login-screen").style.display = "flex";
  document.getElementById("admin-screen").style.display = "none";
}

function showAdminPanel() {
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("admin-screen").style.display = "block";
  loadProductList();
}

async function login(e) {
  e.preventDefault();
  const email = e.target.email.value.trim();
  const password = e.target.password.value;
  const errBox = document.getElementById("login-error");
  errBox.textContent = "";

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    errBox.textContent = "Wrong email or password. Try again.";
    return;
  }
  showAdminPanel();
}

async function logout() {
  await supabaseClient.auth.signOut();
  showLogin();
}

// ---------- Dynamic fields per section ----------
function renderSectionFields() {
  const section = document.getElementById("f-section").value;
  const config = SECTIONS[section] || { fields: [] };
  const wrap = document.getElementById("dynamic-fields");

  const fieldLabels = {
    size: section === "laces" ? "Size (yards)" : "Size",
    color: "Color",
    material: "Material",
    design: "Design",
    style: "Style",
  };

  wrap.innerHTML = config.fields.map(f => `
    <div class="field">
      <label>${fieldLabels[f]}</label>
      <input name="${f}" id="f-${f}">
    </div>
  `).join("");
}

// ---------- Image upload ----------
async function uploadImage(file) {
  const ext = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabaseClient.storage.from("product-images").upload(fileName, file);
  if (error) throw error;
  const { data } = supabaseClient.storage.from("product-images").getPublicUrl(fileName);
  return data.publicUrl;
}

// ---------- Save product ----------
async function saveProduct(e) {
  e.preventDefault();
  const form = e.target;
  const statusEl = document.getElementById("form-status");
  statusEl.textContent = "Saving…";

  const section = form.section.value;
  const config = SECTIONS[section] || { fields: [] };

  const record = {
    section,
    name: form.name.value.trim(),
    price: parseFloat(form.price.value) || 0,
    discount: parseFloat(form.discount.value) || 0,
    in_stock: true,
  };

  config.fields.forEach(f => {
    const el = document.getElementById(`f-${f}`);
    record[f] = el ? el.value.trim() : null;
  });

  const fileInput = document.getElementById("f-image");
  try {
    if (fileInput.files && fileInput.files[0]) {
      statusEl.textContent = "Uploading photo…";
      record.image_url = await uploadImage(fileInput.files[0]);
    }

    if (editingId) {
      const { error } = await supabaseClient.from("products").update(record).eq("id", editingId);
      if (error) throw error;
      statusEl.textContent = "Product updated ✓";
    } else {
      if (!record.image_url) throw new Error("Please choose a photo");
      const { error } = await supabaseClient.from("products").insert([record]);
      if (error) throw error;
      statusEl.textContent = "Product published ✓";
    }

    resetForm();
    loadProductList();
  } catch (err) {
    statusEl.textContent = "Something went wrong: " + (err.message || err);
    console.error(err);
  }
}

function resetForm() {
  editingId = null;
  document.getElementById("product-form").reset();
  document.getElementById("form-title").textContent = "Add a New Product";
  document.getElementById("submit-btn").textContent = "Publish Product";
  renderSectionFields();
  setTimeout(() => (document.getElementById("form-status").textContent = ""), 2500);
}

// ---------- Product list ----------
async function loadProductList() {
  const list = document.getElementById("product-list");
  list.innerHTML = "<p>Loading…</p>";
  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    list.innerHTML = "<p>Couldn't load products.</p>";
    return;
  }

  if (!data.length) {
    list.innerHTML = "<p>No products yet — add your first one above.</p>";
    return;
  }

  list.innerHTML = data.map(p => `
    <div class="admin-row">
      <img src="${p.image_url}" alt="${p.name}">
      <div class="admin-row-info">
        <strong>${p.name}</strong>
        <span>${SECTIONS[p.section]?.label || p.section} · ₦${Number(p.price).toLocaleString()}${p.discount ? ` · -${p.discount}%` : ""}</span>
        <span>${p.in_stock ? "In stock" : "Hidden / out of stock"}</span>
      </div>
      <div class="admin-row-actions">
        <button onclick="editProduct('${p.id}')">Edit</button>
        <button onclick="toggleStock('${p.id}', ${!p.in_stock})">${p.in_stock ? "Hide" : "Show"}</button>
        <button onclick="deleteProduct('${p.id}')" class="danger">Delete</button>
      </div>
    </div>
  `).join("");

  window._productCache = data;
}

function editProduct(id) {
  const p = window._productCache.find(x => x.id === id);
  if (!p) return;
  editingId = id;
  const form = document.getElementById("product-form");
  form.section.value = p.section;
  renderSectionFields();
  form.name.value = p.name || "";
  form.price.value = p.price || "";
  form.discount.value = p.discount || "";

  const config = SECTIONS[p.section] || { fields: [] };
  config.fields.forEach(f => {
    const el = document.getElementById(`f-${f}`);
    if (el) el.value = p[f] || "";
  });

  document.getElementById("form-title").textContent = "Edit Product";
  document.getElementById("submit-btn").textContent = "Save Changes";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function toggleStock(id, newValue) {
  await supabaseClient.from("products").update({ in_stock: newValue }).eq("id", id);
  loadProductList();
}

async function deleteProduct(id) {
  if (!confirm("Delete this product? This can't be undone.")) return;
  await supabaseClient.from("products").delete().eq("id", id);
  loadProductList();
}

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", () => {
  checkSession();
  renderSectionFields();
  document.getElementById("login-form").addEventListener("submit", login);
  document.getElementById("logout-btn").addEventListener("click", logout);
  document.getElementById("f-section").addEventListener("change", renderSectionFields);
  document.getElementById("product-form").addEventListener("submit", saveProduct);
  document.getElementById("cancel-edit").addEventListener("click", resetForm);
});
