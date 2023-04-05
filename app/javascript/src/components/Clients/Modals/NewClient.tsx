import React from "react";

import Logger from "js-logger";
import { XIcon } from "miruIcons";

import clientApi from "apis/clients";
import Toastr from "common/Toastr";

import ClientForm from "./ClientForm";

const EditClient = ({
  setnewClient,
  clientData,
  setClientData,
  clientLogoUrl,
  setClientLogoUrl,
  clientLogo,
  setClientLogo,
  setShowDialog,
}) => {
  const formatFormData = (formData, values) => {
    formData.append("client[name]", values.name);
    formData.append("client[email]", values.email);
    formData.append("client[phone]", values.phone);

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

    if (clientLogoUrl) formData.append("client[logo]", clientLogo);
  };

  const handleSubmit = async values => {
    const formData = new FormData();
    formatFormData(formData, values);

    try {
      const res = await clientApi.create(formData);
      setClientData([...clientData, { ...res.data, minutes: 0 }]);
      setnewClient(false);
      document.location.reload();
      Toastr.success("Client added successfully");
    } catch (error) {
      Logger.error(error);
    }
  };

  const handleDeleteLogo = () => {
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
              <h6 className="text-base font-extrabold">Add New Client</h6>
              <button
                type="button"
                onClick={() => {
                  setShowDialog(false);
                  setnewClient(false);
                }}
              >
                <XIcon color="#CDD6DF" size={16} weight="bold" />
              </button>
            </div>
            <ClientForm
              clientData=""
              clientLogoUrl={clientLogoUrl}
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
