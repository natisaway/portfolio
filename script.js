// ================================
//  Z-INDEX MANAGEMENT
// ================================
let topZ = 100;

function bringToFront(win) {
  topZ += 1;
  win.style.zIndex = topZ;
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
//  UNIVERSAL DRAGGABLE WINDOWS
//  - Mouse: drag from anywhere
//  - Touch: drag from header only (so content can scroll)
// ================================
function makeDraggable(element) {
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  // Try to find a header-like handle for touch
  const touchHandle =
    element.querySelector(".window-header") ||
    element.querySelector(".airhockey-titlebar") ||
    element.querySelector(".vhs-titlebar") ||
    element; // fallback

  // ---- DESKTOP: DRAG FROM ANYWHERE ----
  element.addEventListener("mousedown", function (e) {
    // Only left click
    if (e.button !== 0) return;

    // Skip controls so they behave normally
    if (e.target.closest("button, input, textarea, a, select, iframe, label")) {
      return;
    }

    isDragging = true;
    bringToFront(element);

    const rect = element.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    startLeft = rect.left;
    startTop = rect.top;

    document.body.style.userSelect = "none";
  });

  document.addEventListener("mousemove", function (e) {
    if (!isDragging) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    element.style.left = startLeft + dx + "px";
    element.style.top = startTop + dy + "px";
  });

  document.addEventListener("mouseup", function () {
    if (!isDragging) return;
    isDragging = false;
    document.body.style.userSelect = "";
  });

  // ---- TOUCH: DRAG FROM HEADER ONLY (SO CONTENT CAN SCROLL) ----
  let touchDragging = false;
  let touchStartX = 0;
  let touchStartY = 0;

  touchHandle.addEventListener(
    "touchstart",
    function (e) {
      if (e.touches.length !== 1) return;

      // Skip controls
      if (
        e.target.closest(
          "button, input, textarea, a, select, iframe, label"
        )
      ) {
        return;
      }

      touchDragging = true;
      bringToFront(element);

      const rect = element.getBoundingClientRect();
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      startLeft = rect.left;
      startTop = rect.top;
    },
    { passive: true }
  );

  touchHandle.addEventListener(
    "touchmove",
    function (e) {
      if (!touchDragging || e.touches.length !== 1) return;

      const t = e.touches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;

      element.style.left = startLeft + dx + "px";
      element.style.top = startTop + dy + "px";

      // We only prevent default when dragging FROM THE HANDLE,
      // so inner scroll areas still work.
      e.preventDefault();
    },
    { passive: false }
  );

  touchHandle.addEventListener("touchend", function () {
    touchDragging = false;
  });
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
  if (!modal) return;

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
      bringToFront(modal);
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", closeModal);
  }

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      closeModal();
    }
  });
}

// ================================
//  INIT
// ================================
document.addEventListener("DOMContentLoaded", () => {
  const windows = getAllWindows();

  // Setup draggable + z-index for main windows
  windows.forEach((w) => {
    topZ += 1;
    w.style.zIndex = topZ;
    makeDraggable(w);
  });

  // Open default window
  openWindowById("home");
  updateNoWindowsPopup();

  // Close buttons
  document.querySelectorAll(".close-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const win = e.target.closest(".window");
      if (win) closeWindow(win);
    });
  });

  // Top menu navigation
  document.querySelectorAll("[data-open-window]").forEach((el) => {
    el.addEventListener("click", () => {
      openWindowById(el.getAttribute("data-open-window"));
    });
  });

  // Image modal
  setupImageModal();

  // Make VHS popup draggable (if it exists)
  const vhs = document.getElementById("vhsWindow");
  if (vhs) {
    makeDraggable(vhs);
  }

  // Make Air Hockey popup draggable (if it exists)
  const airHockey = document.getElementById("airHockeyPopup");
  if (airHockey) {
    makeDraggable(airHockey);
  }

  // Make image modal inner draggable (only the box, not the overlay)
  const imageModalInner = document.querySelector(".image-modal-inner");
  if (imageModalInner) {
    makeDraggable(imageModalInner);
  }
});
