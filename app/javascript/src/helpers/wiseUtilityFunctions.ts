export const separateAddressFields = data => {
  const filteredData = { ...data };

  filteredData["addressFields"] = [];

  filteredData["fields"] = filteredData["fields"].map(field => {
    if (
      field["group"][0]["key"].split(".")[0] == "address" ||
      field["group"][0]["key"] == "legalType"
    ) {
      filteredData["addressFields"].push(field);
    } else {
      return field;
    }
  });

  filteredData["fields"] = filteredData["fields"].filter(
    field => field && field["group"][0]["required"]
  );

  return filteredData;
};

export const bankFieldValidationRequirements = (data, isUpdating) => {
  const validationRequirements = {};

  data.forEach(requirement => {
    const type = requirement["type"];
    validationRequirements[type] = { details: { address: {} } };

    requirement["fields"].forEach(field => {
      if (field["group"][0]["required"]) {
        const key = field["group"][0]["key"].split(".");
        const validKey = key[1] || key[0];
        
        if (key[0] === "address") {
          validationRequirements[type]["details"]["address"][validKey] = isUpdating;
        } else {
          validationRequirements[type]["details"][validKey] = isUpdating;
        }
      }
    });
  });

  return { ...validationRequirements[data[0]["type"]] };
};
