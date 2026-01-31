const messagesEl = document.getElementById("messages");
const inputEl = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const csvContentEl = document.getElementById("csvContent");

const homeMessagesEl = document.getElementById("homeMessages");
const homeInputEl = document.getElementById("homeUserInput");
const homeSendBtn = document.getElementById("homeSendBtn");

const navLinks = document.querySelectorAll(".nav-link");
const introTitle = document.getElementById("introTitle");
const introText = document.getElementById("introText");
const homeMarkdownEl = document.getElementById("homeMarkdown");
const projectsMarkdownEl = document.getElementById("projectsMarkdown");

const API_URL = "/api/v1/chat";
const CSV_API_URL = "/api/v1/contacts";
let sessionId = localStorage.getItem("session_id") || "";

const viewCopy = {
  home: {
    title: "GEORGE PINEDA:",
    text:
      "AI Engineer con mas de 1.5 anos de experiencia en desarrollo de soluciones de IA Generativa de alto impacto en sectores como banca, salud, tecnologia, etc."
  },
  chat: {
    title: "AI Chat:",
    text: "Chat con IA generativa, se pueden hacer consultas sobre el perfil."
  },
  projects: {
    title: "Proyectos realizados",
    text: ""
  },
  contact: {
    title: "Deja tu informacion",
    text:
      "Puedes chatear con el agente para brindar tu informacion, este la guardara y se mostrara."
  }
};

const viewMarkdownSources = {
  home: {
    title: "/content/home-page/home-page-title.md",
    text: "/content/home-page/home-page-home.md"
  },
  chat: {
    title: "/content/chat-page/chat-page-title.md",
    text: "/content/chat-page/chat-page-text.md"
  },
  projects: {
    title: "/content/projects-page/projects-page-title.md",
    text: "/content/projects-page/projects-page-text.md"
  },
  contact: {
    title: "/content/contact-page/contact-page-title.md",
    text: "/content/contact-page/contact-page-text.md"
  }
};

function setView(view) {
  const copy = viewCopy[view];
  if (!copy) return;

  document.body.dataset.view = view;
  navLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.view === view);
  });

  if (introTitle) {
    if (copy.titleHtml && window.DOMPurify) {
      introTitle.innerHTML = copy.titleHtml;
    } else {
      introTitle.textContent = copy.title;
    }
  }
  if (introText) {
    if (copy.textHtml && window.DOMPurify) {
      introText.innerHTML = copy.textHtml;
    } else {
      introText.textContent = copy.text;
    }
    introText.style.display = copy.textHtml || copy.text ? "block" : "none";
  }
}

function getViewFromHash() {
  const view = window.location.hash.replace("#", "");
  return viewCopy[view] ? view : "home";
}

navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const view = link.dataset.view;
    if (!viewCopy[view]) return;
    window.location.hash = view;
  });
});

window.addEventListener("hashchange", () => {
  setView(getViewFromHash());
});

setView(getViewFromHash());

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("fetch_failed");
  return res.text();
}

async function loadViewCopyFromMarkdown() {
  if (!window.marked || !window.DOMPurify) return;

  await Promise.all(
    Object.entries(viewMarkdownSources).map(async ([view, sources]) => {
      const copy = viewCopy[view];
      if (!copy) return;

      const [titleText, bodyText] = await Promise.all([
        fetchText(sources.title).catch(() => null),
        fetchText(sources.text).catch(() => null)
      ]);

      if (titleText) {
        copy.titleHtml = DOMPurify.sanitize(marked.parseInline(titleText.trim()));
      }
      if (bodyText) {
        copy.textHtml = DOMPurify.sanitize(marked.parse(bodyText));
      }
    })
  );

  setView(getViewFromHash());
}

async function loadHomeMarkdown() {
  if (!homeMarkdownEl || !window.marked || !window.DOMPurify) return;
  try {
    const text = await fetchText("/content/home-page/home-page-home.md");
    homeMarkdownEl.innerHTML = DOMPurify.sanitize(marked.parse(text));
  } catch (err) {
    homeMarkdownEl.textContent = "No se pudo cargar el contenido.";
  }
}

loadHomeMarkdown();
loadViewCopyFromMarkdown();

// Cargar y renderizar preguntas rápidas desde JSON
async function loadQuickQuestions() {
  try {
    const response = await fetch("/content/quick-questions.json");
    if (!response.ok) throw new Error("No se pudo cargar quick-questions.json");
    
    const data = await response.json();
    renderQuickQuestions(data.questions);
  } catch (err) {
    console.error("Error cargando preguntas rápidas:", err);
  }
}

function renderQuickQuestions(questions) {
  const container = document.getElementById("quickQuestions");
  if (!container) return;
  
  container.innerHTML = "";
  
  questions.forEach(q => {
    const button = document.createElement("button");
    button.className = "question-bubble";
    button.dataset.question = q.question;
    button.textContent = `${q.emoji} ${q.label}`;
    container.appendChild(button);
  });
}

loadQuickQuestions();

async function loadProjectsMarkdown() {
  if (!projectsMarkdownEl || !window.marked || !window.DOMPurify) return;
  try {
    const text = await fetchText("/content/projects-page/projects-page-projects.md");
    projectsMarkdownEl.innerHTML = DOMPurify.sanitize(marked.parse(text));
  } catch (err) {
    projectsMarkdownEl.textContent = "No se pudo cargar el contenido.";
  }
}

loadProjectsMarkdown();

function appendMessage(text, role) {
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  
  // Si es un mensaje del bot y tenemos marked disponible, renderizar como markdown
  if (role === "bot" && window.marked && window.DOMPurify) {
    const htmlContent = marked.parse(text);
    div.innerHTML = DOMPurify.sanitize(htmlContent);
  } else {
    div.textContent = text;
  }
  
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

async function loadCSVData() {
  try {
    const res = await fetch(CSV_API_URL);
    if (!res.ok) throw new Error("CSV API error");
    
    const data = await res.json();
    renderCSVTable(data.contacts || []);
  } catch (err) {
    console.error("Error cargando CSV:", err);
  }
}

function renderCSVTable(contacts) {
  if (!csvContentEl) return;
  
  if (!contacts || contacts.length === 0) {
    csvContentEl.innerHTML = '<p class="csv-placeholder">Los datos del CSV aparecerán aquí cuando se guarde un contacto.</p>';
    return;
  }
  
  const headers = ["Nombres", "Apellidos", "Correo", "Teléfono"];
  
  let html = '<table class="csv-table"><thead><tr>';
  headers.forEach(h => {
    html += `<th>${h}</th>`;
  });
  html += '</tr></thead><tbody>';
  
  contacts.forEach(contact => {
    html += '<tr>';
    html += `<td>${contact.nombres || ''}</td>`;
    html += `<td>${contact.apellidos || ''}</td>`;
    html += `<td>${contact.correo || ''}</td>`;
    html += `<td>${contact.telefono || ''}</td>`;
    html += '</tr>';
  });
  
  html += '</tbody></table>';
  csvContentEl.innerHTML = html;
}

// Cargar datos CSV al inicio y después de cada mensaje
loadCSVData();
setInterval(loadCSVData, 5000); // Recargar cada 5 segundos

// Funciones para el chatbot en Home
function appendHomeMessage(text, role) {
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  
  // Si es un mensaje del bot y tenemos marked disponible, renderizar como markdown
  if (role === "bot" && window.marked && window.DOMPurify) {
    const htmlContent = marked.parse(text);
    div.innerHTML = DOMPurify.sanitize(htmlContent);
  } else {
    div.textContent = text;
  }
  
  homeMessagesEl.appendChild(div);
  homeMessagesEl.scrollTop = homeMessagesEl.scrollHeight;
}

async function sendHomeMessage() {
  const text = homeInputEl.value.trim();
  if (!text) return;

  appendHomeMessage(text, "user");
  homeInputEl.value = "";

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
    appendHomeMessage(data.reply || "Sin respuesta", "bot");
  } catch (err) {
    appendHomeMessage("No pude conectar con el backend.", "bot");
  }
}

homeSendBtn.addEventListener("click", sendHomeMessage);
homeInputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendHomeMessage();
});

// Funcionalidad para las burbujas de preguntas rápidas
const quickQuestionsContainer = document.getElementById("quickQuestions");
if (quickQuestionsContainer) {
  quickQuestionsContainer.addEventListener("click", (e) => {
    const bubble = e.target.closest(".question-bubble");
    if (bubble) {
      const question = bubble.dataset.question;
      if (question && homeInputEl) {
        homeInputEl.value = question;
        sendHomeMessage();
      }
    }
  });
}
