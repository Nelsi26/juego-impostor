const API_URL = "http://localhost:3000";

export async function createRoom(data) {
  const res = await fetch(`${API_URL}/create-room`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function connectRoom(roomCode) {
  const res = await fetch(`${API_URL}/connect?roomCode=${roomCode}`);
  return res.json();
}









