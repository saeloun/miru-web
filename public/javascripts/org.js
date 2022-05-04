let timezones = [];

function setTimeZoneOptions(options) {
  const timeZoneSelect = document.querySelector(".select-timezone");
  timeZoneSelect.innerHTML = "";
  options.forEach((option) => {
    const optionElement = document.createElement("option");
    optionElement.value = option;
    optionElement.innerText = option;
    timeZoneSelect.appendChild(optionElement);
  });
}

document
  .querySelector(".select-country")
  .addEventListener("change", (event) => {
    const country = event.target.value;
    const timeZonesForCountry = timezones[country];
    if (timeZonesForCountry) setTimeZoneOptions(timeZonesForCountry);
  });

async function main() {
  const response = await fetch("/internal_api/v1/timezones");
  const jsonResponse = await response.json();
  timezones = jsonResponse.timezones;
  setTimeZoneOptions(timezones["US"]);
}

main();
