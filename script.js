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
    (windowElement) =>
      (windowElement.dataset.open || "").trim().toLowerCase() === "true"
  );

  const popup = document.getElementById("no-windows-popup");
  if (!popup) return;

  if (anyOpen) {
    popup.classList.add("hidden");
  } else {
    popup.classList.remove("hidden");
  }
}

// ================================
//  WINDOW DRAG AND RESIZE
// ================================

const RESIZE_HANDLE_SIZE = 28;

let viewportIsResizing = false;
let viewportResizeTimer = null;

window.addEventListener("resize", () => {
  viewportIsResizing = true;

  clearTimeout(viewportResizeTimer);

  viewportResizeTimer = setTimeout(() => {
    viewportIsResizing = false;
  }, 180);
});

function pointerIsOnResizeHandle(element, clientX, clientY) {
  const computedStyle = getComputedStyle(element);

  if (computedStyle.resize === "none") {
    return false;
  }

  const rect = element.getBoundingClientRect();

  const isNearRightEdge =
    clientX >= rect.right - RESIZE_HANDLE_SIZE &&
    clientX <= rect.right + 2;

  const isNearBottomEdge =
    clientY >= rect.bottom - RESIZE_HANDLE_SIZE &&
    clientY <= rect.bottom + 2;

  return isNearRightEdge && isNearBottomEdge;
}

function makeDraggable(element) {
  let isDragging = false;
  let isElementResizing = false;

  let resizeEndTimer = null;

  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  const dragHandle =
    element.querySelector(".window-header") ||
    element.querySelector(".airhockey-titlebar") ||
    element.querySelector(".vhs-titlebar") ||
    element;

  // Detect when the element's width or height is changing.
  // During resizing, dragging is disabled.
  if (typeof ResizeObserver !== "undefined") {
    let previousWidth = element.getBoundingClientRect().width;
    let previousHeight = element.getBoundingClientRect().height;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (!entry) return;

      const currentWidth = entry.contentRect.width;
      const currentHeight = entry.contentRect.height;

      const widthChanged =
        Math.abs(currentWidth - previousWidth) > 0.5;

      const heightChanged =
        Math.abs(currentHeight - previousHeight) > 0.5;

      previousWidth = currentWidth;
      previousHeight = currentHeight;

      if (!widthChanged && !heightChanged) {
        return;
      }

      isElementResizing = true;
      isDragging = false;

      element.classList.add("is-resizing");
      document.body.style.userSelect = "none";

      clearTimeout(resizeEndTimer);

      resizeEndTimer = setTimeout(() => {
        isElementResizing = false;

        element.classList.remove("is-resizing");
        document.body.style.userSelect = "";
      }, 140);
    });

    resizeObserver.observe(element);
  }

  // Bring the window forward when clicked.
  element.addEventListener("mousedown", () => {
    bringToFront(element);
  });

  // Start desktop dragging from the title bar only.
  dragHandle.addEventListener("mousedown", (event) => {
    if (event.button !== 0) return;

    if (
      event.target.closest(
        "button, input, textarea, select, option, a, iframe, label"
      )
    ) {
      return;
    }

    if (
      viewportIsResizing ||
      isElementResizing ||
      pointerIsOnResizeHandle(
        element,
        event.clientX,
        event.clientY
      )
    ) {
      isDragging = false;
      return;
    }

    const rect = element.getBoundingClientRect();

    isDragging = true;

    startX = event.clientX;
    startY = event.clientY;

    startLeft = rect.left;
    startTop = rect.top;

    // Lock the current popup position before dragging.
    element.style.left = `${startLeft}px`;
    element.style.top = `${startTop}px`;

    bringToFront(element);

    document.body.style.userSelect = "none";

    event.preventDefault();
  });

  document.addEventListener("mousemove", (event) => {
    if (!isDragging) return;
    if (isElementResizing) return;
    if (viewportIsResizing) return;

    const distanceX = event.clientX - startX;
    const distanceY = event.clientY - startY;

    element.style.left = `${startLeft + distanceX}px`;
    element.style.top = `${startTop + distanceY}px`;
  });

  document.addEventListener("mouseup", () => {
    if (!isDragging) return;

    isDragging = false;
    document.body.style.userSelect = "";
  });

  // Stop dragging if the pointer leaves the browser window.
  window.addEventListener("blur", () => {
    isDragging = false;
    document.body.style.userSelect = "";
  });

  // ================================
  //  TOUCH DRAGGING
  // ================================

  let touchDragging = false;

  let touchStartX = 0;
  let touchStartY = 0;

  dragHandle.addEventListener(
    "touchstart",
    (event) => {
      if (event.touches.length !== 1) return;
      if (isElementResizing) return;
      if (viewportIsResizing) return;

      if (
        event.target.closest(
          "button, input, textarea, select, option, a, iframe, label"
        )
      ) {
        return;
      }

      const touch = event.touches[0];

      if (
        pointerIsOnResizeHandle(
          element,
          touch.clientX,
          touch.clientY
        )
      ) {
        return;
      }

      const rect = element.getBoundingClientRect();

      touchDragging = true;

      touchStartX = touch.clientX;
      touchStartY = touch.clientY;

      startLeft = rect.left;
      startTop = rect.top;

      element.style.left = `${startLeft}px`;
      element.style.top = `${startTop}px`;

      bringToFront(element);
    },
    { passive: true }
  );

  dragHandle.addEventListener(
    "touchmove",
    (event) => {
      if (!touchDragging) return;
      if (event.touches.length !== 1) return;
      if (isElementResizing) return;
      if (viewportIsResizing) return;

      const touch = event.touches[0];

      const distanceX = touch.clientX - touchStartX;
      const distanceY = touch.clientY - touchStartY;

      element.style.left = `${startLeft + distanceX}px`;
      element.style.top = `${startTop + distanceY}px`;

      event.preventDefault();
    },
    { passive: false }
  );

  function stopTouchDragging() {
    touchDragging = false;
  }

  dragHandle.addEventListener(
    "touchend",
    stopTouchDragging
  );

  dragHandle.addEventListener(
    "touchcancel",
    stopTouchDragging
  );
}

// ================================
//  CONTACT FORM
// ================================
const contactForm = document.getElementById("contact-form");

if (contactForm) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const status = document.getElementById("contact-status");

    if (!status) return;

    status.textContent = "Sending...";
    status.style.color = "";

    try {
      const formData = new FormData(contactForm);

      const response = await fetch(contactForm.action, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        status.textContent = "Message sent successfully!";
        status.style.color = "#42f5aa";

        contactForm.reset();
      } else {
        status.textContent =
          "Something went wrong. Please try again.";

        status.style.color = "#ff7b7b";
      }
    } catch (error) {
      console.error("Contact form error:", error);

      status.textContent =
        "Network error. Please try again.";

      status.style.color = "#ff7b7b";
    }
  });
}

// ================================
//  IMAGE MODAL
// ================================
function setupImageModal() {
  const modal = document.getElementById("image-modal");
  const modalImage = document.getElementById(
    "image-modal-img"
  );

  if (!modal || !modalImage) return;

  const closeButton = modal.querySelector(
    ".image-modal-close"
  );

  function closeModal() {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");

    modalImage.src = "";
    modalImage.alt = "";
  }

  document.querySelectorAll(".photo-thumb").forEach(
    (thumbnail) => {
      thumbnail.addEventListener("click", () => {
        modalImage.src = thumbnail.src;
        modalImage.alt =
          thumbnail.alt || "Expanded portfolio photo";

        modal.classList.remove("hidden");
        modal.setAttribute("aria-hidden", "false");

        bringToFront(modal);
      });
    }
  );

  if (closeButton) {
    closeButton.addEventListener(
      "click",
      closeModal
    );
  }

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      !modal.classList.contains("hidden")
    ) {
      closeModal();
    }
  });
}

// ================================
//  INITIALIZATION
// ================================
document.addEventListener("DOMContentLoaded", () => {
  const windows = getAllWindows();

  windows.forEach((windowElement) => {
    topZ += 1;

    windowElement.style.zIndex = topZ;

    makeDraggable(windowElement);
  });

  // Open the home popup on initial load.
  openWindowById("home");

  updateNoWindowsPopup();

  // Main window close buttons.
  document.querySelectorAll(".close-btn").forEach(
    (button) => {
      button.addEventListener("click", (event) => {
        const windowElement =
          event.target.closest(".window");

        if (windowElement) {
          closeWindow(windowElement);
        }
      });
    }
  );

  // Navigation buttons.
  document
    .querySelectorAll("[data-open-window]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const windowId =
          button.getAttribute("data-open-window");

        if (windowId) {
          openWindowById(windowId);
        }
      });
    });

  setupImageModal();

  // VHS popup.
  const vhsPopup =
    document.getElementById("vhsWindow");

  if (vhsPopup) {
    makeDraggable(vhsPopup);
  }

  // Air Hockey popup.
  const airHockeyPopup =
    document.getElementById("airHockeyPopup");

  if (airHockeyPopup) {
    makeDraggable(airHockeyPopup);
  }

  // Expanded image popup.
  const imageModalInner =
    document.querySelector(".image-modal-inner");

  if (imageModalInner) {
    makeDraggable(imageModalInner);
  }
});
