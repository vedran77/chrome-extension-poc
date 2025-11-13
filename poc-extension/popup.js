const STORAGE_KEY = "floatbrowserQuickApps";

const defaultApps = [
  {
    id: "gmail",
    name: "Gmail",
    url: "https://mail.google.com",
    width: 420,
    height: 720,
  },
  {
    id: "notion",
    name: "Notion HQ",
    url: "https://www.notion.so",
    width: 960,
    height: 720,
  },
  {
    id: "linear",
    name: "Linear",
    url: "https://linear.app",
    width: 520,
    height: 720,
  },
  {
    id: "calendar",
    name: "Google Calendar",
    url: "https://calendar.google.com",
    width: 720,
    height: 720,
  },
  {
    id: "slack",
    name: "Slack",
    url: "https://app.slack.com/client",
    width: 420,
    height: 720,
  },
  {
    id: "figma",
    name: "Figma",
    url: "https://www.figma.com/files",
    width: 1200,
    height: 780,
  },
  {
    id: "spotify",
    name: "Spotify",
    url: "https://open.spotify.com",
    width: 420,
    height: 640,
  },
];

const workflowLibrary = [
  {
    id: "daily-planning",
    name: "Daily Planning",
    description: "Calendar + Notion + Linear",
    apps: ["calendar", "notion", "linear"],
  },
  {
    id: "design-review",
    name: "Design Review",
    description: "Figma + Slack huddle",
    apps: ["figma", "slack"],
  },
  {
    id: "deep-focus",
    name: "Deep Focus",
    description: "Notion doc + Spotify mix",
    apps: ["notion", "spotify"],
  },
];

const appListEl = document.getElementById("appList");
const workflowListEl = document.getElementById("workflowList");
const formEl = document.getElementById("appForm");
const resetBtn = document.getElementById("resetApps");
const toastEl = document.getElementById("toast");

let currentApps = [];

document.addEventListener("DOMContentLoaded", init);

async function init() {
  currentApps = await loadApps();
  renderApps(currentApps);
  renderWorkflows(currentApps);
  wireEvents();
}

function wireEvents() {
  appListEl.addEventListener("click", async (event) => {
    const target = event.target;
    if (target.matches("[data-action='launch']")) {
      const id = target.dataset.id;
      const app = currentApps.find((item) => item.id === id);
      if (app) {
        await launchFloatingWindow(app);
        showToast(`Launched ${app.name}`);
      }
    }

    if (target.matches("[data-action='remove']")) {
      const id = target.dataset.id;
      currentApps = currentApps.filter((app) => app.id !== id);
      await saveApps(currentApps);
      renderApps(currentApps);
      renderWorkflows(currentApps);
      showToast("App removed");
    }
  });

  workflowListEl.addEventListener("click", async (event) => {
    const target = event.target;
    if (target.matches("[data-action='workflow']")) {
      const workflowId = target.dataset.id;
      const workflow = workflowLibrary.find((item) => item.id === workflowId);
      if (workflow) {
        await launchWorkflow(workflow);
      }
    }
  });

  formEl.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(formEl);
    const name = formData.get("name").trim();
    const url = formData.get("url").trim();
    const width = Number(formData.get("width"));
    const height = Number(formData.get("height"));

    if (!name || !url) {
      return;
    }

    const newApp = {
      id: crypto.randomUUID(),
      name,
      url,
      width: Number.isFinite(width) ? width : 460,
      height: Number.isFinite(height) ? height : 720,
    };

    currentApps = [...currentApps, newApp];
    await saveApps(currentApps);
    renderApps(currentApps);
    showToast(`${name} saved`);
    formEl.reset();
  });

  resetBtn.addEventListener("click", async () => {
    currentApps = structuredClone(defaultApps);
    await saveApps(currentApps);
    renderApps(currentApps);
    renderWorkflows(currentApps);
    showToast("Defaults restored");
  });
}

async function loadApps() {
  const record = await chrome.storage.sync.get(STORAGE_KEY);
  if (!record[STORAGE_KEY]) {
    await chrome.storage.sync.set({ [STORAGE_KEY]: defaultApps });
    return structuredClone(defaultApps);
  }
  return record[STORAGE_KEY];
}

function saveApps(apps) {
  return chrome.storage.sync.set({ [STORAGE_KEY]: apps });
}

function renderApps(apps) {
  appListEl.innerHTML = "";

  apps.forEach((app) => {
    const li = document.createElement("li");
    li.className = "app-card";

    li.innerHTML = `
      <div class="app-card__meta">
        <span class="app-card__name">${app.name}</span>
        <span class="app-card__url">${new URL(app.url).host}</span>
      </div>
      <div class="app-card__actions">
        <button class="primary" data-action="launch" data-id="${app.id}">Open</button>
        <button class="text-btn" data-action="remove" data-id="${app.id}" title="Remove app">✕</button>
      </div>
    `;

    appListEl.appendChild(li);
  });
}

function renderWorkflows(apps) {
  workflowListEl.innerHTML = "";
  const appMap = new Map(apps.map((app) => [app.id, app]));

  workflowLibrary.forEach((workflow) => {
    const missingApps = workflow.apps.filter((appId) => !appMap.has(appId));
    const btnDisabled = missingApps.length > 0;
    const li = document.createElement("li");
    li.className = "workflow-card";
    li.innerHTML = `
      <div>
        <div class="app-card__name">${workflow.name}</div>
        <div class="app-card__url">${workflow.description}</div>
      </div>
      <button class="primary" data-action="workflow" data-id="${workflow.id}" ${btnDisabled ? "disabled" : ""}>
        Launch
      </button>
    `;
    workflowListEl.appendChild(li);
  });
}

async function launchWorkflow(workflow) {
  const appMap = new Map(currentApps.map((app) => [app.id, app]));
  const toLaunch = workflow.apps
    .map((appId) => appMap.get(appId))
    .filter(Boolean);

  await Promise.all(
    toLaunch.map((app, index) => launchFloatingWindow(app, index))
  );

  showToast(`${workflow.name} workspace live`);
}

function launchFloatingWindow(app, stackIndex = 0) {
  const width = Number(app.width) || 460;
  const height = Number(app.height) || 720;
  const screenWidth = window.screen?.availWidth ?? 1280;
  const left = Math.max(0, screenWidth - width - 40 - stackIndex * 30);
  const top = Math.max(0, 80 + stackIndex * 40);

  return chrome.windows.create({
    url: app.url,
    type: "popup",
    focused: stackIndex === 0,
    width,
    height,
    left,
    top,
  });
}

let toastTimeout;
function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("is-visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toastEl.classList.remove("is-visible"), 2200);
}
