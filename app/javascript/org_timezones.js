document.addEventListener("DOMContentLoaded", () => {
  let timezones = [];

  function setTimeZoneOptions(options) {
    const timeZoneSelect = document.querySelector(".select-timezone");
    timeZoneSelect.innerHTML = "";
    options.forEach(option => {
      const optionElement = document.createElement("option");
      optionElement.value = option;
      optionElement.innerText = option;
      if (window.location.pathname === "/company/new") {
        optionElement.selected =
          option === "(GMT-05:00) Eastern Time (US & Canada)";
      }
      timeZoneSelect.appendChild(optionElement);
    });
  }

  function handleChangeCountry(event) {
    const country = event.target.value;
    const timeZonesForCountry = timezones[country];
    if (timeZonesForCountry) setTimeZoneOptions(timeZonesForCountry);
  }

  const selectCountry = document.querySelector(".select-country");

  selectCountry.addEventListener("change", handleChangeCountry);

  async function main() {
    const response = await fetch("/internal_api/v1/timezones");
    const jsonResponse = await response.json();
    timezones = jsonResponse.timezones;
    if (window.location.pathname === "/company/new") {
      setTimeZoneOptions(timezones[selectCountry.value]);
    }
  }

  main();
});
