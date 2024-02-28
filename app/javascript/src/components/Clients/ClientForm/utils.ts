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

  formData.append(
    "client[addresses_attributes[0][state]]",
    values.state?.value
  );

  formData.append("client[addresses_attributes[0][city]]", values.city?.value);

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
    submitting
  ) {
    return true;
  }

  if (values.name && values.phone && values.address1 && values.country) {
    return false;
  }

  return true;
};
