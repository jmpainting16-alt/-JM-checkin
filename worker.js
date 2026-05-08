/**
 * Cloudflare Worker — Line Notify Proxy
 * แก้ปัญหา CORS เมื่อเรียก Line Notify จากเบราว์เซอร์โดยตรง
 *
 * วิธี deploy:
 * 1. ไปที่ https://workers.cloudflare.com
 * 2. Create Worker → วางโค้ดนี้ → Deploy
 * 3. คัดลอก URL ไปใส่ใน checkin.html (LINE_PROXY)
 */

export default {
  async fetch(request, env) {

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/notify") {
      try {
        const { token, message } = await request.json();

        if (!token || !message) {
          return json({ error: "token and message required" }, 400);
        }

        // ส่งไปหา Line Notify
        const form = new FormData();
        form.append("message", message);

        const lineRes = await fetch("https://notify-api.line.me/api/notify", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });

        const result = await lineRes.json();

        return json(result, lineRes.status, {
          "Access-Control-Allow-Origin": "*",
        });

      } catch (err) {
        return json({ error: err.message }, 500);
      }
    }

    return json({ error: "Not found" }, 404);
  },
};

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      ...extraHeaders,
    },
  });
}
