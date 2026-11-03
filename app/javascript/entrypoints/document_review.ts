import "../stylesheets/application.scss";
import "../src/styles/geist.css";

const token = window.location.hash.slice(1);
window.history.replaceState(null, "", window.location.pathname);

const mount = () => {
  const root = document.getElementById("document-review-root");
  if (!root) return;
  import("../src/components/DocumentSignatures/Review")
    .then(module => module.mountReview(root, token))
    .catch(() => {
      root.textContent =
        "The review page could not load. Open your original email link to try again.";
    });
};
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount, { once: true });
} else mount();
