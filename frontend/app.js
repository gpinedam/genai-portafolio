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
    title: "Deja tu informacion",
    text:
      "Puedes chatear con el agente para brindar tu informacion, este la guardara y se mostrara."
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
  if (!homeMarkdownEl) return;
  
  // Esperar a que se carguen los markdowns primero
  await loadViewCopyFromMarkdown();
  
  // Usar el contenido cargado desde markdown si existe
  if (viewCopy.home.homePanelHtml) {
    homeMarkdownEl.innerHTML = viewCopy.home.homePanelHtml;
    return;
  }
  
  // Si no, usar el contenido hardcoded
  if (viewCopy.home.homePanel) {
    homeMarkdownEl.textContent = viewCopy.home.homePanel;
    return;
  }
  
  // Fallback: intentar cargar directamente
  if (!window.marked || !window.DOMPurify) return;
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
