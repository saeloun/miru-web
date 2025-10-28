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
  formData.append("client[currency]", values.currency?.value);

  const addressIndex = isNewForm ? 0 : client.address?.id ?? 0;
  const addressPrefix = `client[addresses_attributes][${addressIndex}]`;

  if (!isNewForm && client?.address?.id) {
    formData.append(`${addressPrefix}[id]`, client.address.id);
  }

  formData.append(`${addressPrefix}[address_line_1]`, values.address1);
  formData.append(`${addressPrefix}[address_line_2]`, values.address2);
  formData.append(`${addressPrefix}[city]`, values.city);
  formData.append(`${addressPrefix}[state]`, values.state);
  formData.append(`${addressPrefix}[country]`, values.country?.value);
  formData.append(`${addressPrefix}[pin]`, values.zipcode);

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
    errors.address1 ||
    errors.country ||
    errors.state ||
    errors.city ||
    errors.zipcode ||
    errors.currency ||
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
    values.zipcode &&
    values.currency
  ) {
    return false;
  }

  return true;
};
