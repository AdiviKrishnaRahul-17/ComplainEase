
"use strict";

/*
  ComplainEase
  OOSE college demonstration
  Storage: browser localStorage only
*/

const STORAGE_KEY = "complainEaseComplaints";
const USER_KEY = "complainEaseDemoUser";

let currentUser = null;
let currentRole = "student";
let currentView = "dashboard";

// ---------- BASIC HELPERS ----------

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, function (char) {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    return entities[char];
  });
}

function getComplaints() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
}

function saveComplaints(complaints) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
    return true;
  } catch (error) {
    showToast("Could not save data. Check browser storage settings.");
    return false;
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(function () {
    toast.classList.remove("show");
  }, 2800);
}

function makeId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function statusClass(status) {
  if (status === "Resolved") return "status-resolved";
  if (status === "In Progress") return "status-progress";
  return "status-open";
}

// ---------- PAGE NAVIGATION ----------

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(function (page) {
    page.classList.toggle("active", page.id === pageId);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showPublicPage(pageId) {
  showPage(pageId);
}

function openApp(role) {
  if (!currentUser) {
    showToast("Please enter your demo details first.");
    showPage("login");
    return;
  }

  currentRole = role === "admin" ? "admin" : "student";
  currentView = "dashboard";

  document.getElementById("sidebarName").textContent = currentUser.name;
  document.getElementById("sidebarRole").textContent =
    currentRole === "admin" ? "Admin demo" : "Student demo";

  document.getElementById("userAvatar").textContent =
    currentUser.name.trim().charAt(0).toUpperCase() || "U";

  document.getElementById("rolePill").textContent =
    currentRole === "admin" ? "ADMIN DEMO" : "STUDENT DEMO";

  document.getElementById("welcomeTitle").textContent =
    "Welcome back, " + currentUser.name + "!";

  document.getElementById("recentTitle").textContent =
    currentRole === "admin" ? "Recent Complaints" : "Your Recent Complaints";

  document.querySelectorAll(".admin-only").forEach(function (button) {
    button.style.display = currentRole === "admin" ? "block" : "none";
  });

  document.getElementById("switchRole").textContent =
    currentRole === "admin"
      ? "⇄ Switch to Student"
      : "⇄ Switch to Admin";

  showPage("app");
  showView("dashboard");
}

function showView(viewName) {
  if (viewName === "admin" && currentRole !== "admin") {
    showToast("Switch to Admin demo mode to manage complaints.");
    return;
  }

  currentView = viewName;

  document.querySelectorAll(".app-view").forEach(function (view) {
    view.classList.toggle("hidden", view.id !== "view-" + viewName);
  });

  document.querySelectorAll("[data-view]").forEach(function (button) {
    button.classList.toggle("active", button.dataset.view === viewName);
  });

  const titles = {
    dashboard: "Dashboard",
    raise: "Raise Complaint",
    mine: "My Complaints",
    admin: "Manage Complaints"
  };

  document.getElementById("viewTitle").textContent =
    titles[viewName] || "Dashboard";

  renderAll();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---------- USER DEMO ----------

document.getElementById("loginForm").addEventListener("submit", function (event) {
  event.preventDefault();

  const name = document.getElementById("loginName").value.trim();
  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const role = document.getElementById("loginRole").value;

  if (name.length < 2 || !email) {
    showToast("Please enter your name and email.");
    return;
  }

  currentUser = { name: name, email: email };

  try {
    localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
  } catch (error) {
    // The current session can still work without saving the demo profile.
  }

  openApp(role);
});

document.getElementById("registerForm").addEventListener("submit", function (event) {
  event.preventDefault();

  const name = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim().toLowerCase();

  if (name.length < 2 || !email) {
    showToast("Please enter a valid name and email.");
    return;
  }

  currentUser = { name: name, email: email };

  try {
    localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
  } catch (error) {
    // Continue with this session if browser storage is unavailable.
  }

  document.getElementById("loginName").value = name;
  document.getElementById("loginEmail").value = email;

  showToast("Demo profile created! Welcome to ComplainEase.");
  openApp("student");
});

document.getElementById("switchRole").addEventListener("click", function () {
  openApp(currentRole === "student" ? "admin" : "student");
});

document.getElementById("logoutButton").addEventListener("click", function () {
  currentUser = null;
  currentRole = "student";
  showPublicPage("home");
  showToast("Returned to Home. Your saved complaints remain in this browser.");
});

// ---------- CREATE A COMPLAINT ----------

document.getElementById("complaintForm").addEventListener("submit", function (event) {
  event.preventDefault();

  if (!currentUser) {
    showToast("Please open the demo dashboard first.");
    showPage("login");
    return;
  }

  if (currentRole !== "student") {
    showToast("Switch to Student mode to submit a complaint.");
    return;
  }

  const title = document.getElementById("complaintTitle").value.trim();
  const category = document.getElementById("complaintCategory").value;
  const priority = document.getElementById("complaintPriority").value;
  const description = document.getElementById("complaintDescription").value.trim();

  if (!title || !category || !description) {
    showToast("Please complete all required fields.");
    return;
  }

  const complaints = getComplaints();

  const complaint = {
    id: makeId(),
    title: title,
    category: category,
    priority: priority,
    description: description,
    status: "Open",
    createdBy: currentUser.email,
    studentName: currentUser.name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  complaints.unshift(complaint);

  if (!saveComplaints(complaints)) return;

  document.getElementById("complaintForm").reset();

  showToast("Complaint submitted successfully!");
  showView("mine");
});

// ---------- COMPLAINT DISPLAY ----------

function getVisibleComplaints() {
  const complaints = getComplaints();

  if (currentRole === "admin") {
    return complaints;
  }

  return complaints.filter(function (complaint) {
    return complaint.createdBy === currentUser?.email;
  });
}

function complaintCard(complaint, includeStudent) {
  const status = ["Open", "In Progress", "Resolved"].includes(complaint.status)
    ? complaint.status
    : "Open";

  const studentDetails = includeStudent
    ? '<p><strong>Submitted by:</strong> ' +
      escapeHTML(complaint.studentName) + " (" +
      escapeHTML(complaint.createdBy) + ")</p>"
    : "";

  return `
    <article class="complaint-item">
      <div class="complaint-top">
        <h4>${escapeHTML(complaint.title)}</h4>
        <span class="status ${statusClass(status)}">${escapeHTML(status)}</span>
      </div>

      <div class="complaint-meta">
        <span class="tag">${escapeHTML(complaint.category)}</span>
        <span class="tag">Priority: ${escapeHTML(complaint.priority)}</span>
        <span class="tag">ID: ${escapeHTML(complaint.id.slice(0, 8))}</span>
      </div>

      ${studentDetails}

      <p>${escapeHTML(complaint.description)}</p>

      <div class="complaint-date">
        Submitted: ${escapeHTML(formatDate(complaint.createdAt))}
        ${complaint.updatedAt && complaint.updatedAt !== complaint.createdAt
          ? " · Updated: " + escapeHTML(formatDate(complaint.updatedAt))
          : ""}
      </div>
    </article>
  `;
}

function emptyMessage(title, message, showButton) {
  return `
    <div class="empty-state">
      <div class="empty-icon">☘</div>
      <h3>${escapeHTML(title)}</h3>
      <p>${escapeHTML(message)}</p>
      ${showButton
        ? '<button class="btn btn-small" data-view="raise">＋ Raise a Complaint</button>'
        : ""}
    </div>
  `;
}

function renderList(elementId, complaints, includeStudent) {
  const element = document.getElementById(elementId);

  if (!complaints.length) {
    element.innerHTML = emptyMessage(
      "No complaints yet",
      "When a complaint is submitted, it will appear here.",
      currentRole === "student"
    );
    return;
  }

  element.innerHTML = '<div class="complaint-list">' +
    complaints.map(function (complaint) {
      return complaintCard(complaint, includeStudent);
    }).join("") +
    "</div>";
}

function renderDashboard() {
  const complaints = getVisibleComplaints();

  document.getElementById("totalCount").textContent = complaints.length;
  document.getElementById("openCount").textContent =
    complaints.filter(function (c) { return c.status === "Open"; }).length;
  document.getElementById("progressCount").textContent =
    complaints.filter(function (c) { return c.status === "In Progress"; }).length;
  document.getElementById("resolvedCount").textContent =
    complaints.filter(function (c) { return c.status === "Resolved"; }).length;

  renderList("recentList", complaints.slice(0, 3), currentRole === "admin");
}

function renderAll() {
  if (!currentUser) return;

  renderDashboard();

  renderList(
    "myComplaintList",
    getVisibleComplaints(),
    false
  );

  renderAdminComplaints();
}

// ---------- ADMIN STATUS MANAGEMENT ----------

function renderAdminComplaints() {
  const element = document.getElementById("adminComplaintList");

  if (currentRole !== "admin") {
    element.innerHTML = "";
    return;
  }

  const complaints = getComplaints();

  if (!complaints.length) {
    element.innerHTML = emptyMessage(
      "No complaints to manage",
      "Submit a test complaint in Student mode, then return here.",
      false
    );
    return;
  }

  element.innerHTML = '<div class="complaint-list">' +
    complaints.map(function (complaint) {
      return `
        <article class="complaint-item">
          <div class="complaint-top">
            <h4>${escapeHTML(complaint.title)}</h4>
            <span class="status ${statusClass(complaint.status)}">
              ${escapeHTML(complaint.status)}
            </span>
          </div>

          <div class="complaint-meta">
            <span class="tag">${escapeHTML(complaint.category)}</span>
            <span class="tag">Priority: ${escapeHTML(complaint.priority)}</span>
          </div>

          <p><strong>Student:</strong>
            ${escapeHTML(complaint.studentName)} ·
            ${escapeHTML(complaint.createdBy)}
          </p>
          <p>${escapeHTML(complaint.description)}</p>

          <div class="admin-controls">
            <label for="status-${escapeHTML(complaint.id)}">Update status:</label>
            <select id="status-${escapeHTML(complaint.id)}"
              data-status-id="${escapeHTML(complaint.id)}">
              <option value="Open" ${complaint.status === "Open" ? "selected" : ""}>Open</option>
              <option value="In Progress" ${complaint.status === "In Progress" ? "selected" : ""}>In Progress</option>
              <option value="Resolved" ${complaint.status === "Resolved" ? "selected" : ""}>Resolved</option>
            </select>
            <button class="btn btn-small" data-update-id="${escapeHTML(complaint.id)}">
              Save Status
            </button>
          </div>

          <div class="complaint-date">
            Submitted: ${escapeHTML(formatDate(complaint.createdAt))}
          </div>
        </article>
      `;
    }).join("") +
    "</div>";
}

document.getElementById("adminComplaintList").addEventListener("click", function (event) {
  const button = event.target.closest("[data-update-id]");
  if (!button) return;

  if (currentRole !== "admin") {
    showToast("Switch to Admin demo mode first.");
    return;
  }

  const id = button.dataset.updateId;
  const select = document.querySelector('[data-status-id="' + CSS.escape(id) + '"]');

  if (!select) {
    showToast("Status selector not found.");
    return;
  }

  const newStatus = select.value;
  const complaints = getComplaints();
  const complaint = complaints.find(function (item) {
    return item.id === id;
  });

  if (!complaint) {
    showToast("Complaint not found.");
    return;
  }

  complaint.status = newStatus;
  complaint.updatedAt = new Date().toISOString();

  if (!saveComplaints(complaints)) return;

  renderAll();
  showToast("Complaint status updated to " + newStatus + ".");
});

// ---------- CLICK HANDLERS ----------

document.addEventListener("click", function (event) {
  const pageButton = event.target.closest("[data-page]");

  if (pageButton) {
    event.preventDefault();
    const page = pageButton.dataset.page;
    showPublicPage(page);
    return;
  }

  const viewButton = event.target.closest("[data-view]");

  if (viewButton) {
    event.preventDefault();
    showView(viewButton.dataset.view);
  }
});

// ---------- STARTUP ----------

try {
  const savedUser = JSON.parse(localStorage.getItem(USER_KEY) || "null");

  if (
    savedUser &&
    typeof savedUser.name === "string" &&
    typeof savedUser.email === "string"
  ) {
    document.getElementById("loginName").value = savedUser.name;
    document.getElementById("loginEmail").value = savedUser.email;
    document.getElementById("registerName").value = savedUser.name;
    document.getElementById("registerEmail").value = savedUser.email;
  }
} catch (error) {
  // Ignore invalid saved demo profile data.
}

showPage("home");
