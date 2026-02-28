const homeMessagesEl = document.getElementById("homeMessages");
const homeInputEl = document.getElementById("homeUserInput");
const homeSendBtn = document.getElementById("homeSendBtn");

const navLinks = document.querySelectorAll(".nav-link");
const introTitle = document.getElementById("introTitle");
const introText = document.getElementById("introText");
const homeMarkdownEl = document.getElementById("homeMarkdown");
const projectsMarkdownEl = document.getElementById("projectsMarkdown");

const API_URL = "/api/v1/chat";
let sessionId = localStorage.getItem("session_id") || "";
let remainingQuestions = null;
let isRateLimited = false;

const viewCopy = {
  home: {
    title: "GEORGE PINEDA:",
    text:
      "AI Engineer con mas de 1.5 anos de experiencia en desarrollo de soluciones de IA Generativa de alto impacto en sectores como banca, salud, tecnologia, etc.",
    homePanel: "Ingeniero Mecatrónico especializado en IA Generativa"
  },
  projects: {
    title: "Proyectos realizados",
    text: ""
  },
  contact: {
    title: "Contacto",
    text: ""
  }
};

const viewMarkdownSources = {
  home: {
    title: "/content/home-page/home-page-title.md",
    text: "/content/home-page/home-page-home.md",
    homePanel: "/content/home-page/home-page-panel.md"
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

      const promises = [
        fetchText(sources.title).catch(() => null),
        fetchText(sources.text).catch(() => null)
      ];
      
      // Si existe homePanel, agregarlo a las promesas
      if (sources.homePanel) {
        promises.push(fetchText(sources.homePanel).catch(() => null));
      }

      const results = await Promise.all(promises);
      const [titleText, bodyText, homePanelText] = results;

      if (titleText) {
        copy.titleHtml = DOMPurify.sanitize(marked.parseInline(titleText.trim()));
      }
      if (bodyText) {
        copy.textHtml = DOMPurify.sanitize(marked.parse(bodyText));
      }
      if (homePanelText) {
        copy.homePanelHtml = DOMPurify.sanitize(marked.parse(homePanelText));
      }
    })
  );

  setView(getViewFromHash());
}

async function loadHomeMarkdown() {
  // Replace with the rich visual panel
  renderHomePanel();

  // Still load markdown sources for intro text in header
  await loadViewCopyFromMarkdown();
}

loadHomeMarkdown();
loadViewCopyFromMarkdown();

// ====================================================
// RICH HOME PANEL — Metrics + Tech Stack
// ====================================================
function renderHomePanel() {
  if (!homeMarkdownEl) return;

  homeMarkdownEl.innerHTML = `
    <div class="impact-metrics">
      <div class="metric-card">
        <div class="metric-value">95%</div>
        <div class="metric-label">Reducción tiempo de selección de CVs</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">99%</div>
        <div class="metric-label">Ahorro validación documental</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">7+</div>
        <div class="metric-label">Proyectos end-to-end entregados</div>
      </div>
    </div>

    <div class="stack-section">
      <div class="stack-row">
        <span class="stack-cat">LLMs</span>
        <span class="stack-badge">GPT-4.1</span>
        <span class="stack-badge">LangChain</span>
        <span class="stack-badge">RAG</span>
        <span class="stack-badge">Fine-tuning</span>
        <span class="stack-badge">MCP</span>
        <span class="stack-badge">Multiagente</span>
      </div>
      <div class="stack-row">
        <span class="stack-cat">Cloud</span>
        <span class="stack-badge">Azure OpenAI</span>
        <span class="stack-badge">AWS</span>
        <span class="stack-badge">FastAPI</span>
        <span class="stack-badge">Flask</span>
        <span class="stack-badge">Python</span>
        <span class="stack-badge">ChromaDB</span>
        <span class="stack-badge">Pinecone</span>
      </div>
    </div>

    <div class="industries-section">
      <div class="stack-group-label">Industrias</div>
      <div class="industries-grid">
        <div class="industry-card">🏦 <span>Banca</span></div>
        <div class="industry-card">🏥 <span>Salud</span></div>
        <div class="industry-card">⚖️ <span>Legal</span></div>
        <div class="industry-card">🌱 <span>Agricultura</span></div>
        <div class="industry-card">💼 <span>Reclutamiento</span></div>
        <div class="industry-card">🤝 <span>Gobierno</span></div>
      </div>
    </div>
  `;
}

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
  // Inject suggestion cards directly into the messages area
  const block = document.createElement("div");
  block.className = "suggestions-block";
  block.id = "suggestionsBlock";

  questions.forEach(q => {
    const btn = document.createElement("button");
    btn.className = "suggestion-card";
    btn.dataset.question = q.question;
    btn.innerHTML = `<span class="suggestion-emoji">${q.emoji}</span><span class="suggestion-label">${q.label}</span>`;
    block.appendChild(btn);
  });

  homeMessagesEl.appendChild(block);
  homeMessagesEl.scrollTop = homeMessagesEl.scrollHeight;
}

function removeSuggestions() {
  const el = document.getElementById("suggestionsBlock");
  if (el) el.remove();
}

loadQuickQuestions();

// Cargar y mostrar proyectos dinámicamente
async function loadProjects() {
  try {
    const response = await fetch("/content/projects/projects-list.json");
    if (!response.ok) throw new Error("No se pudo cargar projects-list.json");
    
    const data = await response.json();
    
    // Separar proyectos por tipo
    const projectsConDemo = data.projects.filter(p => p.type === "con-demo");
    const projectsSinDemo = data.projects.filter(p => p.type === "sin-demo");
    
    renderProjectsGrid(projectsConDemo, "projectsGridDemo", true);
    renderProjectsGrid(projectsSinDemo, "projectsGridNoDemo", false);
  } catch (err) {
    console.error("Error cargando proyectos:", err);
  }
}

function renderProjectsGrid(projects, gridId, hasDemo) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  
  grid.innerHTML = "";
  
  projects.forEach(project => {
    const card = document.createElement("div");
    
    // Construir clases de forma modular
    const classes = ['project-card'];
    if (hasDemo) classes.push('has-demo');
    if (project.implementation) {
      classes.push(`impl-${project.implementation}`);
    }
    card.className = classes.join(' ');
    
    // Determinar si hay imagen personalizada
    const hasCustomImage = project.image && !project.image.includes('placeholder');
    const imageStyle = hasCustomImage 
      ? `style="background-image: url('${project.image}'); background-size: cover; background-position: center;"` 
      : '';
    const imageClass = hasCustomImage ? 'has-custom-image' : '';
    
    card.innerHTML = `
      <div class="project-card-image ${imageClass}" ${imageStyle}></div>
      <div class="project-card-content">
        <div class="project-card-category">${project.category}</div>
        <h3 class="project-card-title">${project.title}</h3>
        <div class="project-card-tags">
          ${project.tags.map(tag => `<span class="project-tag">${tag}</span>`).join('')}
        </div>
      </div>
    `;
    
    card.addEventListener("click", () => openProjectModal(project));
    grid.appendChild(card);
  });
}

async function openProjectModal(project) {
  const modal = document.getElementById("projectModal");
  const modalBody = document.getElementById("modalBody");
  
  if (!modal || !modalBody) return;
  
  try {
    const response = await fetch(`/content/projects/${project.file}`);
    if (!response.ok) throw new Error("No se pudo cargar el proyecto");
    
    const markdown = await response.text();
    
    let htmlContent = "";
    
    // Si tiene demo, agregar el video de YouTube al inicio
    if (project.type === "con-demo" && project.demoUrl) {
      htmlContent += `
        <div class="project-demo-video">
          <iframe 
            src="${project.demoUrl}" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
          </iframe>
        </div>
      `;
    }
    
    if (window.marked && window.DOMPurify) {
      htmlContent += DOMPurify.sanitize(marked.parse(markdown));
      modalBody.innerHTML = htmlContent;
    } else {
      modalBody.innerHTML = htmlContent + markdown;
    }
    
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  } catch (err) {
    console.error("Error cargando detalles del proyecto:", err);
    modalBody.innerHTML = "<p>Error cargando el proyecto.</p>";
    modal.classList.add("active");
  }
}

function closeProjectModal() {
  const modal = document.getElementById("projectModal");
  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }
}

// Event listeners para el modal
const modalClose = document.getElementById("modalClose");
const projectModal = document.getElementById("projectModal");

if (modalClose) {
  modalClose.addEventListener("click", closeProjectModal);
}

if (projectModal) {
  projectModal.addEventListener("click", (e) => {
    if (e.target === projectModal) {
      closeProjectModal();
    }
  });
}

// Cerrar modal con tecla ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeProjectModal();
  }
});

loadProjects();

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

function updateQuestionCounter() {
  const counterEl = document.getElementById("questionCounter");
  if (!counterEl) return;

  if (isRateLimited) {
    counterEl.textContent = "⚠ bloqueado";
    counterEl.style.color = "#ff5555";
  } else if (remainingQuestions !== null) {
    if (remainingQuestions <= 2) {
      counterEl.textContent = `${remainingQuestions} restante${remainingQuestions !== 1 ? "s" : ""}`;
      counterEl.style.color = "#ff5555";
    } else if (remainingQuestions <= 4) {
      counterEl.textContent = `${remainingQuestions} restantes`;
      counterEl.style.color = "#ffa500";
    } else {
      counterEl.textContent = "";
      counterEl.style.color = "";
    }
  }
}

// ====================================================
// CHAT — Typing indicator helpers
// ====================================================
function showTypingIndicator() {
  const div = document.createElement("div");
  div.className = "typing-indicator";
  div.id = "typingIndicator";
  div.innerHTML = `
    <span class="typing-dot"></span>
    <span class="typing-dot"></span>
    <span class="typing-dot"></span>
  `;
  homeMessagesEl.appendChild(div);
  homeMessagesEl.scrollTop = homeMessagesEl.scrollHeight;
  return div;
}

function removeTypingIndicator() {
  const el = document.getElementById("typingIndicator");
  if (el) el.remove();
}

function createStreamingBotMessage() {
  removeTypingIndicator();
  const div = document.createElement("div");
  div.className = "msg bot streaming";
  homeMessagesEl.appendChild(div);
  homeMessagesEl.scrollTop = homeMessagesEl.scrollHeight;
  return div;
}

function finalizeStreamingMessage(msgEl, fullText) {
  msgEl.classList.remove("streaming");
  if (window.marked && window.DOMPurify) {
    msgEl.innerHTML = DOMPurify.sanitize(marked.parse(fullText));
  } else {
    msgEl.textContent = fullText;
  }
  homeMessagesEl.scrollTop = homeMessagesEl.scrollHeight;
}

function addResponseMeta(msgEl, elapsedMs, tokens) {
  const sec = (elapsedMs / 1000).toFixed(1);
  const meta = document.createElement("div");
  meta.className = "msg-meta";
  meta.textContent = `GPT-4.1 · ${sec}s · ${tokens} tok`;
  msgEl.insertAdjacentElement("afterend", meta);
  homeMessagesEl.scrollTop = homeMessagesEl.scrollHeight;
}

// ====================================================
// CHAT — SSE streaming send
// ====================================================
async function sendHomeMessage() {
  const text = homeInputEl.value.trim();
  if (!text) return;

  if (isRateLimited) {
    appendHomeMessage("El chat está bloqueado temporalmente. Por favor espera el tiempo indicado.", "bot");
    return;
  }

  removeSuggestions();
  appendHomeMessage(text, "user");
  homeInputEl.value = "";
  homeInputEl.disabled = true;
  homeSendBtn.disabled = true;
  showTypingIndicator();

  try {
    const res = await fetch("/api/v1/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, session_id: sessionId })
    });

    // Rate limited—raw JSON response, not a stream
    if (res.status === 429) {
      removeTypingIndicator();
      const data = await res.json();
      isRateLimited = true;
      remainingQuestions = data.remaining_questions ?? 0;
      updateQuestionCounter();
      appendHomeMessage(
        data.error || "Has alcanzado el límite de preguntas. ¡Contáctame directamente!",
        "bot"
      );
      return;
    }

    if (!res.ok || !res.body) {
      removeTypingIndicator();
      appendHomeMessage("No pude conectar con el backend.", "bot");
      return;
    }

    const sendTime = Date.now();
    let tokenCount = 0;
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let done = false;
    let msgEl = null;
    let fullText = "";

    while (!done) {
      const { done: streamDone, value } = await reader.read();
      if (streamDone) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop(); // keep incomplete tail

      for (const part of parts) {
        if (!part.startsWith("data: ")) continue;
        try {
          const event = JSON.parse(part.slice(6));

          if (event.type === "session") {
            sessionId = event.session_id;
            localStorage.setItem("session_id", sessionId);
            remainingQuestions = event.remaining_questions;
            updateQuestionCounter();

          } else if (event.type === "chunk") {
            fullText += event.content;
            tokenCount++;
            const tl = document.getElementById("tokenLive");
            if (tl) tl.textContent = tokenCount + " tok";
            if (!msgEl) msgEl = createStreamingBotMessage();
            msgEl.textContent = fullText;
            homeMessagesEl.scrollTop = homeMessagesEl.scrollHeight;

          } else if (event.type === "done") {
            done = true;
            const tl = document.getElementById("tokenLive");
            if (tl) tl.textContent = "";
            if (msgEl) {
              finalizeStreamingMessage(msgEl, fullText);
              addResponseMeta(msgEl, Date.now() - sendTime, tokenCount);
            } else {
              removeTypingIndicator();
            }

          } else if (event.type === "error") {
            done = true;
            const tl = document.getElementById("tokenLive");
            if (tl) tl.textContent = "";
            if (!msgEl) msgEl = createStreamingBotMessage();
            finalizeStreamingMessage(msgEl, event.content || "Error al generar la respuesta.");
          }
        } catch (_) {}
      }
    }

    if (!done && fullText && msgEl) {
      const tl = document.getElementById("tokenLive");
      if (tl) tl.textContent = "";
      removeToolCallPill();
      finalizeStreamingMessage(msgEl, fullText);
      addResponseMeta(msgEl, Date.now() - sendTime, tokenCount);
    }

  } catch (err) {
    removeTypingIndicator();
    appendHomeMessage("No pude conectar con el backend.", "bot");
  } finally {
    homeInputEl.disabled = false;
    homeSendBtn.disabled = false;
    homeInputEl.focus();
  }
}

homeSendBtn.addEventListener("click", sendHomeMessage);
homeInputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !homeInputEl.disabled) sendHomeMessage();
});

// ====================================================
// CONTACT VIEW — Copy email button
// ====================================================
const copyEmailBtn = document.getElementById("copyEmailBtn");
if (copyEmailBtn) {
  copyEmailBtn.addEventListener("click", () => {
    const email = "gpineda@pucp.edu.pe";
    navigator.clipboard.writeText(email).then(() => {
      copyEmailBtn.textContent = "✓ Copiado";
      setTimeout(() => { copyEmailBtn.textContent = "Copiar"; }, 2000);
    }).catch(() => {
      copyEmailBtn.textContent = "Copiar";
    });
  });
}

// Suggestion cards click handler (delegated on messages area)
homeMessagesEl.addEventListener("click", (e) => {
  const card = e.target.closest(".suggestion-card");
  if (card) {
    const question = card.dataset.question;
    if (question && homeInputEl) {
      removeSuggestions();
      homeInputEl.value = question;
      sendHomeMessage();
    }
  }
});
