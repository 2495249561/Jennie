const jsonResponse = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json;charset=UTF-8" },
  });

const ensureTable = async (db) => {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS guestbook (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);
};

const toEntry = (row) => ({
  id: row.id,
  name: row.name,
  message: row.message,
  createdAt: row.created_at,
});

export async function onRequest(context) {
  const { request, env } = context;

  if (!env.GUESTBOOK_DB) {
    return jsonResponse({ error: "Guestbook database not configured." }, 500);
  }

  const method = request.method.toUpperCase();
  if (!["GET", "POST"].includes(method)) {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  await ensureTable(env.GUESTBOOK_DB);

  if (method === "GET") {
    const { results } = await env.GUESTBOOK_DB.prepare(
      "SELECT id, name, message, created_at FROM guestbook ORDER BY id DESC LIMIT 20"
    ).all();

    return jsonResponse({ entries: results.map(toEntry) });
  }

  let payload = {};
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    payload = await request.json();
  } else {
    const form = await request.formData();
    payload = Object.fromEntries(form.entries());
  }

  const name = `${payload.name || ""}`.trim();
  const message = `${payload.message || ""}`.trim();

  if (!name || !message) {
    return jsonResponse({ error: "Name and message are required." }, 400);
  }

  if (name.length > 30 || message.length > 200) {
    return jsonResponse({ error: "Message is too long." }, 400);
  }

  const createdAt = new Date().toISOString();
  await env.GUESTBOOK_DB.prepare(
    "INSERT INTO guestbook (name, message, created_at) VALUES (?1, ?2, ?3)"
  )
    .bind(name, message, createdAt)
    .run();

  const { results } = await env.GUESTBOOK_DB.prepare(
    "SELECT id, name, message, created_at FROM guestbook ORDER BY id DESC LIMIT 20"
  ).all();

  return jsonResponse({ entries: results.map(toEntry) }, 201);
}
