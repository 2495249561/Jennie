function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json;charset=UTF-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function loadEntries(kv) {
  const stored = await kv.get("entries");
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

async function saveEntries(kv, entries) {
  await kv.put("entries", JSON.stringify(entries));
}

export async function onRequest(context) {
  const { request, env } = context;
  const kv = env.GUESTBOOK;

  if (!kv) {
    return jsonResponse({ error: "GUESTBOOK KV 未配置。" }, 500);
  }

  if (request.method === "GET") {
    const entries = await loadEntries(kv);
    return jsonResponse({ entries });
  }

  if (request.method === "POST") {
    const contentType = request.headers.get("content-type") || "";
    let payload = {};
    if (contentType.includes("application/json")) {
      payload = await request.json();
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      payload = Object.fromEntries(formData.entries());
    }

    const name = (payload.name || "").trim().slice(0, 40);
    const message = (payload.message || "").trim().slice(0, 200);

    if (!message) {
      return jsonResponse({ error: "留言内容不能为空。" }, 400);
    }

    const entries = await loadEntries(kv);
    const nextEntry = {
      name,
      message,
      createdAt: formatDate(Date.now()),
    };
    const updatedEntries = [nextEntry, ...entries].slice(0, 20);
    await saveEntries(kv, updatedEntries);

    return jsonResponse({ entries: updatedEntries }, 201);
  }

  return jsonResponse({ error: "Method Not Allowed" }, 405);
}
