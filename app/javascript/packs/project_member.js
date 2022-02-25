document.addEventListener("DOMContentLoaded", () => {
  const link = document.querySelector(".add_fields");
  link.onclick = addNewFields;
  console.log(link.getAttribute("data-fields"));
  console.log("judis $$$$$$$%%%%");

  function addNewFields () {
    const fields = document.querySelectorAll("#new_project .field");
    const fields_length = fields.length - 1;
    fields[fields_length].insertAdjacentHTML(
      "afterend",
      link.getAttribute("data-fields")
    );
  }
});
