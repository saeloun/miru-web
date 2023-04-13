import React, { useState } from "react";

import { XIcon } from "miruIcons";

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
  const [apiError, setApiError] = useState<string>("");

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
              apiError={apiError}
              clientData={clientData}
              clientLogo={clientLogo}
              clientLogoUrl={clientLogoUrl}
              handleDeleteLogo={handleDeleteLogo}
              setApiError={setApiError}
              setClientData={setClientData}
              setClientLogo={setClientLogo}
              setClientLogoUrl={setClientLogoUrl}
              setnewClient={setnewClient}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditClient;
