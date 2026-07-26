/**
 * Utility helper to manage guest_id UUID in localStorage.
 */
export function getGuestId() {
  let guestId = localStorage.getItem("guest_id");
  if (!guestId) {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      guestId = crypto.randomUUID();
    } else {
      guestId = "guest_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
    }
    localStorage.setItem("guest_id", guestId);
  }
  return guestId;
}

export function clearGuestId() {
  localStorage.removeItem("guest_id");
}
