import React, { useState } from "react";

import { XIcon } from "miruIcons";

import clientApi from "apis/clients";

import ClientForm from "./ClientForm";

interface IEditClient {
  setShowEditDialog: any;
  client: any;
}

const EditClient = ({ setShowEditDialog, client }: IEditClient) => {
  const [apiError, setApiError] = useState<string>("");
  const [clientLogoUrl, setClientLogoUrl] = useState<string>(client.logo);
  const [clientLogo, setClientLogo] = useState("");

  const formatFormData = (formData, values) => {
    formData.append("client[name]", values.name);
    formData.append("client[email]", values.email);
    formData.append("client[phone]", values.phone);

    formData.append("client[addresses_attributes[0][id]]", client.address.id);

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

    formData.append(
      "client[addresses_attributes[0][city]]",
      values.city?.value
    );

    formData.append(
      "client[addresses_attributes[0][country]]",
      values.country?.value
    );

    formData.append("client[addresses_attributes[0][pin]]", values.zipcode);

    if (clientLogo) formData.append("client[logo]", clientLogo);

    return formData;
  };

  const handleSubmit = async values => {
    const formData = new FormData();
    formatFormData(formData, values);

    await clientApi
      .update(client.id, formData)
      .then(() => {
        setShowEditDialog(false);
        document.location.reload();
      })
      .catch(e => {
        setApiError(e.message);
      });
  };

  const handleDeleteLogo = event => {
    event.preventDefault();

    setClientLogo("");
    setClientLogoUrl("");
  };

  return (
    <div className="flex items-center justify-center px-4">
      <div
        className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-10 flex items-start justify-center overflow-auto"
        style={{
          backgroundColor: "rgba(29, 26, 49, 0.6)",
        }}
      >
        <div className="relative h-full w-full px-4 md:flex md:items-center md:justify-center">
          <div className="modal-width transform rounded-lg bg-white px-6 pb-6 shadow-xl transition-all sm:max-w-md sm:align-middle">
            <div className="mt-6 flex items-center justify-between">
              <h6 className="text-base font-extrabold">Edit Client</h6>
              <button
                type="button"
                onClick={() => {
                  setShowEditDialog(false);
                }}
              >
                <XIcon color="#CDD6DF" size={16} weight="bold" />
              </button>
            </div>
            <ClientForm
              apiError={apiError}
              clientData={client}
              clientLogoUrl={clientLogoUrl}
              formType="edit"
              handleDeleteLogo={handleDeleteLogo}
              handleSubmit={handleSubmit}
              setClientLogo={setClientLogo}
              setClientLogoUrl={setClientLogoUrl}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditClient;
