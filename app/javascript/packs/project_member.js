document.addEventListener("DOMContentLoaded", () => {
  const link = document.querySelector(".add_fields");
  link.onclick = addNewFields;

  function addNewFields () {
    const fields = document.querySelectorAll("#new_project .field");
    const fields_length = fields.length - 1;
    fields[fields_length].insertAdjacentHTML(
      "afterend",
      link.getAttribute("data-fields")
    );
  }
});
