import React, { useState } from "react";

import { XIcon } from "miruIcons";

import { useUserContext } from "context/UserContext";

import ClientForm from "./ClientForm";
import MobileClientForm from "./MobileClientForm";

const NewClient = ({
  setnewClient,
  clientData,
  setClientData,
  clientLogoUrl,
  setClientLogoUrl,
  clientLogo,
  setClientLogo,
  setShowDialog,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
  const [mobileClientView, setMobileClientView] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string>("");

  const handleDeleteLogo = () => {
    setClientLogo("");
    setClientLogoUrl("");
  };

  const { isDesktop } = useUserContext();

  return isDesktop ? (
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
  ) : (
    <MobileClientForm
      apiError={apiError}
      clientData={clientData}
      clientLogoUrl={clientLogoUrl}
      handleDeleteLogo={handleDeleteLogo}
      setApiError={setApiError}
      setClientData={setClientData}
      setClientLogo={setClientLogo}
      setClientLogoUrl={setClientLogoUrl}
      setShowDialog={setShowDialog}
      setSubmitting={setSubmitting}
      setnewClient={setnewClient}
      submitting={submitting}
    />
  );
};

export default NewClient;
