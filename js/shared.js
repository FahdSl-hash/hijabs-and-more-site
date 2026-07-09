// ==========================================================================
// SHARED — used by both index.html (storefront) and admin.html
// ==========================================================================
const SECTIONS = {
  hijabs: { label: "Hijabs", icon: "🧕", fields: ["size", "color", "material", "design"] },
  veils: { label: "Veils", icon: "🖤", fields: ["material", "size", "design", "color"] },
  shoes: { label: "Shoes", icon: "👡", fields: ["size", "color"] },
  laces: { label: "Laces", icon: "🧵", fields: ["size"] }, // size = yards
  atamfa: { label: "Atamfa", icon: "🧣", fields: ["style"] },
  others: { label: "Others", icon: "✨", fields: [] },
};

function formatNaira(n) {
  return Number(n).toLocaleString("en-NG", { maximumFractionDigits: 0 });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
