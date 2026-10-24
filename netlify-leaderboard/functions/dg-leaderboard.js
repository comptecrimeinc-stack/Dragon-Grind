const mem = global.__DG_LB || (global.__DG_LB = { players: [], lastPost: {} });
function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
  };
}
function sanitize(p) {
  const name = String(p.name || "").replace(/[\u0000-\u001F]/g, "").trim().slice(0, 24);
  if (!name || name.length < 2) return null;
  return {
    name,
    dragon: String(p.dragon || "fire").slice(0, 24),
    frame: String(p.frame || "cw1").slice(0, 12),
    life: Math.max(0, Math.min(1e18, Number(p.life) || 0)),
    kills: Math.max(0, Math.min(1e9, Math.floor(Number(p.kills) || 0))),
    rk: Math.max(0, Math.min(1000, Math.floor(Number(p.rk) || 0))),
    asc: Math.max(0, Math.min(100, Math.floor(Number(p.asc) || 0))),
    updatedAt: Date.now(),
  };
}
exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: cors() };
  if (event.httpMethod === "GET") {
    const players = mem.players.slice().sort((a, b) => b.life - a.life).slice(0, 200);
    return { statusCode: 200, headers: cors(), body: JSON.stringify({ ok: true, players, total: players.length }) };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: cors(), body: JSON.stringify({ ok: false, error: "method" }) };
  }
  let body = {};
  try { body = JSON.parse(event.body || "{}"); } catch {
    return { statusCode: 400, headers: cors(), body: JSON.stringify({ ok: false, error: "json" }) };
  }
  const player = sanitize(body);
  if (!player) return { statusCode: 400, headers: cors(), body: JSON.stringify({ ok: false, error: "name" }) };
  const key = player.name.toLowerCase();
  const now = Date.now();
  if (mem.lastPost[key] && now - mem.lastPost[key] < 8000) {
    return { statusCode: 429, headers: cors(), body: JSON.stringify({ ok: false, error: "rate" }) };
  }
  mem.lastPost[key] = now;
  const idx = mem.players.findIndex((x) => String(x.name).toLowerCase() === key);
  if (idx >= 0) {
    const prev = mem.players[idx];
    mem.players[idx] = { ...prev, ...player, life: Math.max(prev.life || 0, player.life) };
  } else mem.players.push(player);
  mem.players.sort((a, b) => b.life - a.life);
  mem.players = mem.players.slice(0, 200);
  const rank = mem.players.findIndex((x) => String(x.name).toLowerCase() === key) + 1;
  return { statusCode: 200, headers: cors(), body: JSON.stringify({ ok: true, rank, total: mem.players.length }) };
};
