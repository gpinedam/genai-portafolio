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

// ============================================
// PROJECTS — Carga dinámica, filtros, modal
// ============================================

let allProjects = [];
let activeFilter = 'todos';

async function loadProjects() {
  try {
    const response = await fetch("/content/projects/projects-list.json");
    if (!response.ok) throw new Error("No se pudo cargar projects-list.json");
    const data = await response.json();
    allProjects = data.projects || [];
    buildFilterPills(allProjects);
    renderProjects('todos');
  } catch (err) {
    console.error("Error cargando proyectos:", err);
  }
}

function buildFilterPills(projects) {
  const bar = document.getElementById("projectsFilterBar");
  if (!bar) return;

  const filters = [
    { value: 'todos', label: 'Todos' },
    { value: 'con-demo', label: '▶ Con Demo' },
    ...Array.from(new Set(projects.map(p => p.category)))
      .sort()
      .map(cat => ({ value: cat, label: cat }))
  ];

  bar.innerHTML = filters.map(f => `
    <button class="filter-pill${f.value === 'todos' ? ' active' : ''}" data-filter="${f.value}">
      ${f.label}
    </button>
  `).join('');

  bar.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      bar.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeFilter = pill.dataset.filter;
      renderProjects(activeFilter);
    });
  });

  // View toggle (grid / list)
  const toggleEl = document.getElementById('projectsViewToggle');
  if (toggleEl) {
    toggleEl.innerHTML = `
      <button class="view-toggle-btn active" data-layout="grid" title="Vista cuadrícula">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <rect x="0" y="0" width="6" height="6" rx="1"/>
          <rect x="8" y="0" width="6" height="6" rx="1"/>
          <rect x="0" y="8" width="6" height="6" rx="1"/>
          <rect x="8" y="8" width="6" height="6" rx="1"/>
        </svg>
      </button>
      <button class="view-toggle-btn" data-layout="list" title="Vista lista">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <rect x="0" y="0" width="14" height="2.5" rx="1"/>
          <rect x="0" y="5.75" width="14" height="2.5" rx="1"/>
          <rect x="0" y="11.5" width="14" height="2.5" rx="1"/>
        </svg>
      </button>
    `;
    toggleEl.querySelectorAll('.view-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        toggleEl.querySelectorAll('.view-toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const grid = document.getElementById('projectsGrid');
        if (grid) grid.classList.toggle('list-view', btn.dataset.layout === 'list');
      });
    });
  }
}

const IMPL_LABELS = {
  enterprise: { label: 'ENTERPRISE', color: '#ffd700' },
  poc:        { label: 'POC',        color: '#4a9eff' },
  mvp:        { label: 'MVP',        color: '#9b59b6' },
  demo:       { label: 'DEMO',       color: '#f6c638' }
};

function renderProjects(filter) {
  const grid = document.getElementById("projectsGrid");
  const countEl = document.getElementById("projectsCount");
  if (!grid) return;

  let filtered = allProjects;
  if (filter === 'con-demo') {
    filtered = allProjects.filter(p => p.type === 'con-demo');
  } else if (filter !== 'todos') {
    filtered = allProjects.filter(p => p.category === filter);
  }

  // Featured primero
  filtered = [
    ...filtered.filter(p => p.featured),
    ...filtered.filter(p => !p.featured)
  ];

  if (countEl) {
    const total = allProjects.length;
    const shown = filtered.length;
    countEl.textContent = shown === total
      ? `${total} proyectos`
      : `${shown} de ${total} proyectos`;
  }

  grid.innerHTML = '';

  if (filtered.length === 0) {
    grid.innerHTML = '<p class="projects-empty">No hay proyectos en esta categoría.</p>';
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = parseInt(entry.target.style.transitionDelay) || 0;
        entry.target.classList.add('card-visible');
        // Clear stagger delay after entry so hover transitions are instant
        setTimeout(() => {
          entry.target.style.transitionDelay = '0ms';
        }, delay + 450);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  filtered.forEach((project, i) => {
    const card = createProjectCard(project, i);
    grid.appendChild(card);
    observer.observe(card);
  });
}

function createProjectCard(project, index) {
  const card = document.createElement('div');
  const impl = project.implementation || '';
  const isFeatured = project.featured;
  const hasDemo = project.type === 'con-demo';

  const classes = ['project-card'];
  if (impl) classes.push(`impl-${impl}`);
  if (isFeatured) classes.push('featured');
  if (hasDemo) classes.push('has-demo');
  card.className = classes.join(' ');
  // Stagger delay for IntersectionObserver entry animation
  card.style.transitionDelay = `${index * 55}ms`;

  const implInfo = IMPL_LABELS[impl];
  // Expose impl color as CSS var for hover border
  if (implInfo) card.style.setProperty('--card-impl-color', implInfo.color);

  const hasCustomImage = project.image && !project.image.includes('placeholder');
  const imageStyle = hasCustomImage
    ? `style="background-image:url('${project.image}');background-size:cover;background-position:center;"`
    : '';
  const imageClass = hasCustomImage ? 'has-custom-image' : '';

  const implBadge = implInfo
    ? `<span class="impl-badge" style="--impl-color:${implInfo.color}">${implInfo.label}</span>`
    : '';

  card.innerHTML = `
    <div class="project-card-image ${imageClass}" ${imageStyle}>
      <div class="card-img-bottom">
        <span class="project-card-category">${project.category}</span>
        ${implBadge}
      </div>
      <div class="project-card-overlay">
        <span class="overlay-cta">${hasDemo ? '▶ Ver Demo' : 'Ver Proyecto'}</span>
      </div>
    </div>
    <div class="project-card-content">
      <div class="card-list-meta">
        <span class="project-card-category">${project.category}</span>
        ${implBadge}
      </div>
      <h3 class="project-card-title">${project.title}</h3>
      <div class="project-card-tags">
        ${project.tags.slice(0, 3).map(tag => `<span class="project-tag">${tag}</span>`).join('')}
      </div>
    </div>
  `;

  card.addEventListener('click', () => openProjectModal(project));
  return card;
}

async function openProjectModal(project) {
  const modal = document.getElementById("projectModal");
  const modalBody = document.getElementById("modalBody");
  if (!modal || !modalBody) return;

  const impl = project.implementation || '';
  const implInfo = IMPL_LABELS[impl];
  const implBadge = implInfo
    ? `<span class="impl-badge modal-impl-badge" style="--impl-color:${implInfo.color}">${implInfo.label}</span>`
    : '';

  const hasCustomImage = project.image && !project.image.includes('placeholder');
  const headerBg = hasCustomImage
    ? `background-image:url('${project.image}');background-size:cover;background-position:center;`
    : '';

  const hasDemo = project.type === 'con-demo' && project.demoUrl;

  let htmlContent = `
    <div class="modal-project-header" style="${headerBg}">
      <div class="modal-project-header-overlay">
        <div class="modal-project-header-badges">
          ${implBadge}
          <span class="modal-category-badge">${project.category}</span>
          ${hasDemo ? '<span class="modal-demo-badge">▶ Con Demo</span>' : ''}
        </div>
        <h1 class="modal-project-title">${project.title}</h1>
        <div class="modal-project-tags">
          ${project.tags.map(tag => `<span class="project-tag">${tag}</span>`).join('')}
        </div>
      </div>
    </div>
  `;

  if (hasDemo) {
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

  modalBody.innerHTML = htmlContent + '<div class="modal-markdown-body"><p style="color:var(--text-muted);font-size:13px">Cargando...</p></div>';
  modal.classList.add("active");
  document.body.style.overflow = "hidden";

  try {
    const response = await fetch(`/content/projects/${project.file}`);
    if (!response.ok) throw new Error("No se pudo cargar el proyecto");
    const markdown = await response.text();
    const mdEl = modalBody.querySelector('.modal-markdown-body');
    if (mdEl && window.marked && window.DOMPurify) {
      mdEl.innerHTML = DOMPurify.sanitize(marked.parse(markdown));
    } else if (mdEl) {
      mdEl.textContent = markdown;
    }
  } catch (err) {
    console.error("Error cargando detalles del proyecto:", err);
    const mdEl = modalBody.querySelector('.modal-markdown-body');
    if (mdEl) mdEl.innerHTML = "<p>Error cargando el proyecto.</p>";
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
    if (e.target === projectModal) closeProjectModal();
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeProjectModal();
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
