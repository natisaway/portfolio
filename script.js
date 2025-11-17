// ================================
//  Z-INDEX MANAGEMENT & DRAGGING
// ================================
let topZ = 100;

function bringToFront(win) {
  topZ += 1;
  win.style.zIndex = topZ;
}

function getTouchDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

// ======================================================
//   DRAGGING + PINCH RESIZE (DESKTOP + MOBILE)
// ======================================================
function makeDraggable(win) {
  const header = win.querySelector(".window-header");
  if (!header) return;

  // -------------------------------------
  // DESKTOP DRAGGING
  // -------------------------------------
  let isDown = false;
  let startX = 0,
    startY = 0,
    winStartX = 0,
    winStartY = 0;

  header.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;

    isDown = true;
    bringToFront(win);

    const rect = win.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    winStartX = rect.left;
    winStartY = rect.top;

    document.body.style.userSelect = "none";
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDown) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    win.style.left = winStartX + dx + "px";
    win.style.top = winStartY + dy + "px";
  });

  document.addEventListener("mouseup", () => {
    isDown = false;
    document.body.style.userSelect = "";
  });

  // -------------------------------------
  // MOBILE DRAGGING (SMOOTH FACTOR)
  // -------------------------------------
  let dragging = false;
  let touchStartX = 0,
    touchStartY = 0,
    winStartLeft = 0,
    winStartTop = 0;

  const DRAG_FACTOR = 1.0; // Change 0.7 for smoother dragging

  header.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;

    const t = e.touches[0];
    dragging = true;

    bringToFront(win);

    const rect = win.getBoundingClientRect();
    touchStartX = t.clientX;
    touchStartY = t.clientY;

    winStartLeft = rect.left;
    winStartTop = rect.top;
  });

  header.addEventListener("touchmove", (e) => {
    if (!dragging || e.touches.length !== 1) return;

    const t = e.touches[0];

    const dx = (t.clientX - touchStartX) * DRAG_FACTOR;
    const dy = (t.clientY - touchStartY) * DRAG_FACTOR;

    win.style.left = winStartLeft + dx + "px";
    win.style.top = winStartTop + dy + "px";

    e.preventDefault();
  });

  header.addEventListener("touchend", () => {
    dragging = false;
  });

  // -------------------------------------
  // PINCH TO RESIZE
  // -------------------------------------
  let lastDist = 0;
  let pinchStartWidth = 0;
  let pinchStartHeight = 0;

  win.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 2) return;

    const rect = win.getBoundingClientRect();
    pinchStartWidth = rect.width;
    pinchStartHeight = rect.height;

    lastDist = getTouchDistance(e.touches);
    bringToFront(win);
  });

  win.addEventListener("touchmove", (e) => {
    if (e.touches.length !== 2) return;

    e.preventDefault();

    const newDist = getTouchDistance(e.touches);
    const scale = newDist / lastDist;

    const newWidth = pinchStartWidth * scale;
    const newHeight = pinchStartHeight * scale;

    win.style.width =
      Math.max(200, Math.min(newWidth, window.innerWidth)) + "px";
    win.style.height =
      Math.max(160, Math.min(newHeight, window.innerHeight)) + "px";
  });

  // Bring to front on tap
  win.addEventListener("touchstart", () => bringToFront(win));
  win.addEventListener("mousedown", () => bringToFront(win));
}

// ================================
//  WINDOW OPEN / CLOSE LOGIC
// ================================
function getAllWindows() {
  return Array.from(document.querySelectorAll(".window"));
}

function openWindowById(id) {
  const win = document.querySelector(`.window[data-window-id="${id}"]`);
  if (!win) return;

  win.dataset.open = "true";
  win.style.display = "flex";
  bringToFront(win);
  updateNoWindowsPopup();
}

function closeWindow(win) {
  win.dataset.open = "false";
  win.style.display = "none";
  updateNoWindowsPopup();
}

function updateNoWindowsPopup() {
  const windows = getAllWindows();

  const anyOpen = windows.some(
    (w) => (w.dataset.open || "").trim().toLowerCase() === "true"
  );

  const popup = document.getElementById("no-windows-popup");
  if (!popup) return;

  if (anyOpen) popup.classList.add("hidden");
  else popup.classList.remove("hidden");
}

// ================================
//  CONTACT FORM HANDLER
// ================================
const contactForm = document.getElementById("contact-form");

if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const status = document.getElementById("contact-status");

    try {
      const data = new FormData(contactForm);
      const res = await fetch(contactForm.action, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        status.textContent = "Message sent successfully!";
        status.style.color = "#42f5aa";
        contactForm.reset();
      } else {
        status.textContent = "Oops! Something went wrong.";
        status.style.color = "#ff7b7b";
      }
    } catch (err) {
      status.textContent = "Network error. Please try again.";
      status.style.color = "#ff7b7b";
    }
  });
}

// ================================
//  IMAGE MODAL
// ================================
function setupImageModal() {
  const modal = document.getElementById("image-modal");
  const modalImg = document.getElementById("image-modal-img");
  const closeBtn = modal.querySelector(".image-modal-close");

  function closeModal() {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    modalImg.src = "";
    modalImg.alt = "";
  }

  document.querySelectorAll(".photo-thumb").forEach((thumb) => {
    thumb.addEventListener("click", () => {
      modalImg.src = thumb.src;
      modalImg.alt = thumb.alt || "Photo";
      modal.classList.remove("hidden");
      modal.setAttribute("aria-hidden", "false");
    });
  });

  closeBtn.addEventListener("click", closeModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden"))
      closeModal();
  });
}

// ================================
//  INIT
// ================================
document.addEventListener("DOMContentLoaded", () => {
  const windows = getAllWindows();

  // Setup windows
  windows.forEach((w) => {
    topZ += 1;
    w.style.zIndex = topZ;
    makeDraggable(w);
  });

  openWindowById("home");
  updateNoWindowsPopup();

  document.querySelectorAll(".close-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const win = e.target.closest(".window");
      if (win) closeWindow(win);
    });
  });

  document.querySelectorAll("[data-open-window]").forEach((el) => {
    el.addEventListener("click", () => {
      openWindowById(el.getAttribute("data-open-window"));
    });
  });

  setupImageModal();
});
