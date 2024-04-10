export const formatFormData = (
  formData,
  values,
  isNewForm,
  client,
  clientLogo,
  clientLogoUrl
) => {
  formData.append("client[name]", values.name);
  formData.append("client[phone]", values.phone);

  if (!isNewForm) {
    formData.append("client[addresses_attributes[0][id]]", client.address.id);
  }

  formData.append(
    "client[addresses_attributes[0][address_line_1]]",
    values.address1
  );

  formData.append(
    "client[addresses_attributes[0][address_line_2]]",
    values.address2
  );

  formData.append("client[addresses_attributes[0][state]]", values.state);

  formData.append("client[addresses_attributes[0][city]]", values.city);

  formData.append(
    "client[addresses_attributes[0][country]]",
    values.country?.value
  );

  formData.append("client[addresses_attributes[0][pin]]", values.zipcode);

  if (clientLogo && isNewForm) formData.append("client[logo]", clientLogo);

  if (clientLogoUrl && clientLogo && !isNewForm) {
    formData.append("client[logo]", clientLogo);
  }

  if (!clientLogoUrl && !clientLogo && !isNewForm) {
    formData.append("client[logo]", clientLogo);
  }

  return formData;
};

export const disableBtn = (values, errors, submitting) => {
  if (
    errors.name ||
    errors.phone ||
    errors.address1 ||
    errors.country ||
    errors.state ||
    errors.city ||
    errors.zipcode ||
    submitting
  ) {
    return true;
  }

  if (
    values.name &&
    values.address1 &&
    values.country &&
    values.state &&
    values.city &&
    values.zipcode
  ) {
    return false;
  }

  return true;
};
