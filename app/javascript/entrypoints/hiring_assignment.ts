import "../stylesheets/application.scss";
import "../src/styles/geist.css";

const token = window.location.hash.slice(1);
window.history.replaceState(null, "", window.location.pathname);

const mount = () => {
  const root = document.getElementById("hiring-assignment-root");
  if (!root) return;
  import("../src/components/Hiring/AssessmentPortal")
    .then(module => module.mountAssessmentPortal(root, token))
    .catch(() => {
      root.textContent =
        "The assignment could not load. Open your original link to try again.";
    });
};
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount, { once: true });
} else mount();
