const messagesEl = document.getElementById("messages");
const inputEl = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

const API_URL = "/api/v1/chat";
let sessionId = localStorage.getItem("session_id") || "";

function appendMessage(text, role) {
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.textContent = text;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

async function sendMessage() {
  const text = inputEl.value.trim();
  if (!text) return;

  appendMessage(text, "user");
  inputEl.value = "";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, session_id: sessionId })
    });

    if (!res.ok) throw new Error("API error");

    const data = await res.json();
    if (data.session_id) {
      sessionId = data.session_id;
      localStorage.setItem("session_id", sessionId);
    }
    appendMessage(data.reply || "Sin respuesta", "bot");
  } catch (err) {
    appendMessage("No pude conectar con el backend.", "bot");
  }
}

sendBtn.addEventListener("click", sendMessage);
inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});
