window.showImage = function () {
  return {
    showPreview(event) {
      if (event.target.files.length > 0) {
        const preview = document.getElementById("preview");
        preview.src = URL.createObjectURL(event.target.files[0]);
        preview.style.display = "block";
        document.getElementById("clear-preview").classList.remove("hidden");
        document.getElementById("add-logo").classList.add("hidden");
      }
    },
    clearPreview() {
      const preview = document.getElementById("preview");
      preview.removeAttribute("src");
      preview.style.display = "none";
      document.getElementById("clear-preview").classList.toggle("hidden");
      document.getElementById("company_logo").value = "";
      document.getElementById("add-logo").classList.remove("hidden");
    },
  };
};
