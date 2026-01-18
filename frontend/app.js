const messagesEl = document.getElementById("messages");
const inputEl = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

const navLinks = document.querySelectorAll(".nav-link");
const introTitle = document.getElementById("introTitle");
const introText = document.getElementById("introText");
const homeMarkdownEl = document.getElementById("homeMarkdown");
const projectsMarkdownEl = document.getElementById("projectsMarkdown");

const API_URL = "/api/v1/chat";
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
