// UI logic: storage, tabs, dispute tracker, letter preview, profile.

const STORE_KEY = "creditDisputeHelper.v1";
const RESPONSE_DAYS = 30;

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return { profile: {}, disputes: [], ...JSON.parse(raw) };
  } catch (e) { /* storage unavailable */ }
  return { profile: {}, disputes: [] };
}

let state = loadState();

function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
}

const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// ---------- Tabs ----------
function showTab(name) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
  document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("active", p.id === name));
  if (name === "letters") renderLetterOptions();
}
document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => showTab(t.dataset.tab)));

// ---------- Deadlines ----------
function dueDate(d) {
  if (!d.dateSent) return null;
  const due = new Date(d.dateSent + "T00:00:00");
  due.setDate(due.getDate() + RESPONSE_DAYS);
  return due;
}

function daysLeft(d) {
  const due = dueDate(d);
  if (!due) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due - today) / 86400000);
}

function deadlineBadge(d) {
  if (d.status !== "sent") return "";
  const left = daysLeft(d);
  if (left === null) return `<span class="badge warn">Add mailing date</span>`;
  const due = dueDate(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  if (left < 0) return `<span class="badge danger">Overdue by ${-left} day${left === -1 ? "" : "s"} (due ${due})</span>`;
  if (left <= 7) return `<span class="badge warn">${left} day${left === 1 ? "" : "s"} left (due ${due})</span>`;
  return `<span class="badge ok">${left} days left (due ${due})</span>`;
}

// ---------- Dispute tracker ----------
const form = $("#dispute-form");
const itemSel = $("#item-type");
const errorSel = $("#error-type");

itemSel.innerHTML = Object.entries(ITEM_TYPES).map(([k, v]) => `<option value="${k}">${esc(v.label)}</option>`).join("");

function fillErrorOptions() {
  const kind = ITEM_TYPES[itemSel.value] || ITEM_TYPES.account;
  const prev = errorSel.value;
  errorSel.innerHTML = kind.errors.map((k) => `<option value="${k}">${esc(ERROR_TYPES[k][0])}</option>`).join("");
  if (kind.errors.includes(prev)) errorSel.value = prev;
  $("#item-tip").textContent = kind.tip;
}
itemSel.addEventListener("change", fillErrorOptions);
fillErrorOptions();

function itemLabel(d) {
  const kind = ITEM_TYPES[d.itemType || "account"];
  const err = ERROR_TYPES[d.errorType] || ERROR_TYPES.other;
  return `${kind.label}: ${err[0]}`;
}

function renderDisputes() {
  const list = $("#dispute-list");
  if (!state.disputes.length) {
    list.innerHTML = `<p class="muted empty">No disputes yet. Add the first error you found on your credit report above.</p>`;
  } else {
    list.innerHTML = state.disputes.map((d) => `
      <div class="card dispute" data-id="${d.id}">
        <div class="dispute-head">
          <div>
            <strong>${esc(d.creditor)}</strong> <span class="muted">${esc(d.account)}</span><br>
            <span class="muted small">${esc(BUREAUS[d.bureau].name)} · ${esc(itemLabel(d))} · ${esc(STATUS_LABELS[d.status])}</span>
          </div>
          <div>${deadlineBadge(d)}</div>
        </div>
        <p class="small">${esc(d.details)}</p>
        <div class="actions">
          <button type="button" data-act="letter">Write letter</button>
          <button type="button" data-act="edit">Edit</button>
          <button type="button" data-act="delete" class="danger-btn">Delete</button>
        </div>
      </div>`).join("");
  }
  renderSummary();
}

function renderSummary() {
  const sent = state.disputes.filter((d) => d.status === "sent");
  const overdue = sent.filter((d) => (daysLeft(d) ?? 1) < 0).length;
  const soon = sent.filter((d) => { const l = daysLeft(d); return l !== null && l >= 0 && l <= 7; }).length;
  const el = $("#deadline-summary");
  if (!sent.length) { el.innerHTML = ""; return; }
  let msg = `${sent.length} dispute${sent.length === 1 ? "" : "s"} waiting for a response.`;
  if (overdue) msg += ` <strong>${overdue} past the 30-day deadline.</strong> If you got no answer, follow up or file a CFPB complaint.`;
  else if (soon) msg += ` ${soon} due within a week.`;
  el.innerHTML = `<div class="card ${overdue ? "alert" : "info"}">${msg}</div>`;
}

function resetForm() {
  form.reset();
  form.elements.id.value = "";
  fillErrorOptions();
  $("#dispute-form-title").textContent = "Add an item to dispute";
  $("#cancel-edit").classList.add("hidden");
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  if (data.dateSent && data.status === "draft") data.status = "sent";
  if (data.id) {
    state.disputes = state.disputes.map((d) => (d.id === data.id ? { ...d, ...data } : d));
  } else {
    data.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    state.disputes.unshift(data);
  }
  save();
  resetForm();
  renderDisputes();
});

$("#cancel-edit").addEventListener("click", resetForm);

$("#dispute-list").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-act]");
  if (!btn) return;
  const id = btn.closest(".dispute").dataset.id;
  const d = state.disputes.find((x) => x.id === id);
  if (btn.dataset.act === "delete") {
    if (confirm(`Delete the dispute for ${d.creditor}?`)) {
      state.disputes = state.disputes.filter((x) => x.id !== id);
      save();
      renderDisputes();
    }
  } else if (btn.dataset.act === "edit") {
    itemSel.value = d.itemType || "account";
    fillErrorOptions();
    for (const [k, v] of Object.entries(d)) if (form.elements[k]) form.elements[k].value = v;
    $("#dispute-form-title").textContent = `Edit: ${d.creditor}`;
    $("#cancel-edit").classList.remove("hidden");
    $("#dispute-form-card").open = true;
    form.scrollIntoView({ behavior: "smooth" });
  } else if (btn.dataset.act === "letter") {
    showTab("letters");
    $("#letter-dispute").value = id;
    $("#letter-type").value = d.errorType === "identity_theft" ? "block605b" : d.status === "verified" ? "verification" : "bureau611";
    renderLetter();
  }
});

// ---------- Backup ----------
$("#export-data").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `credit-disputes-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});

$("#import-data").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data.disputes)) throw new Error("bad file");
    state = { profile: data.profile || {}, disputes: data.disputes };
    save();
    fillProfile();
    renderDisputes();
    alert("Backup restored.");
  } catch (err) {
    alert("That file doesn't look like a backup from this app.");
  }
  e.target.value = "";
});

// ---------- Letters ----------
function renderLetterOptions() {
  const sel = $("#letter-dispute");
  const current = sel.value;
  sel.innerHTML = state.disputes.length
    ? state.disputes.map((d) => `<option value="${d.id}">${esc(d.creditor)} (${esc(BUREAUS[d.bureau].name)})</option>`).join("")
    : `<option value="">Add a dispute first</option>`;
  if (state.disputes.some((d) => d.id === current)) sel.value = current;
  renderLetter();
}

function renderLetter() {
  const type = $("#letter-type").value;
  const tpl = LETTERS[type];
  $("#letter-hint").textContent = tpl.hint;
  const d = state.disputes.find((x) => x.id === $("#letter-dispute").value);
  const out = $("#letter-output");
  if (!d) {
    out.textContent = "Add an item on the Disputes tab, then come back here to turn it into a letter.";
    return;
  }
  out.textContent = tpl.build(state.profile, d);
}

$("#letter-dispute").addEventListener("change", renderLetter);
$("#letter-type").addEventListener("change", renderLetter);
$("#print-letter").addEventListener("click", () => window.print());
$("#copy-letter").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText($("#letter-output").innerText);
    $("#copy-letter").textContent = "Copied";
    setTimeout(() => ($("#copy-letter").textContent = "Copy text"), 1500);
  } catch (e) {
    alert("Couldn't copy. Select the letter text and copy it manually.");
  }
});

// ---------- Profile ----------
const profileForm = $("#profile-form");
function fillProfile() {
  for (const el of profileForm.elements) if (el.name) el.value = state.profile[el.name] || "";
}
profileForm.addEventListener("submit", (e) => {
  e.preventDefault();
  state.profile = Object.fromEntries(new FormData(profileForm).entries());
  save();
  $("#profile-saved").classList.remove("hidden");
  setTimeout(() => $("#profile-saved").classList.add("hidden"), 1500);
});

// ---------- Guide ----------
$("#bureau-addresses").innerHTML = Object.values(BUREAUS)
  .map((b) => `<li><strong>${b.name}:</strong> ${b.address.join(", ")} · <a href="${b.url}" target="_blank" rel="noopener">dispute online</a></li>`)
  .join("");

fillProfile();
renderDisputes();
