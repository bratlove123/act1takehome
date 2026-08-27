const BASE_URL = "/api/items";

export async function fetchItems({ search = "", category = "", page = 1, limit = 5 }) {
  const params = new URLSearchParams({ search, category, page, limit });
  const res = await fetch(`${BASE_URL}?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch items");
  return res.json();
}

export async function createItem(item) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error("Failed to create item");
  return res.json();
}

export async function toggleItemStock(id) {
  const res = await fetch(`${BASE_URL}/${id}/stock`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error("Failed to update stock");
  return res.json();
}
