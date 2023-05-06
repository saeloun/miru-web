import React, { useState } from "react";

import { XIcon } from "miruIcons";

import { useUserContext } from "context/UserContext";

import ClientForm from "./ClientForm";
import MobileClientForm from "./MobileClientForm";

interface IEditClient {
  setShowEditDialog: any;
  client: any;
}

const EditClient = ({ setShowEditDialog, client }: IEditClient) => {
  const [apiError, setApiError] = useState<string>("");
  const [clientLogoUrl, setClientLogoUrl] = useState<string>(
    client?.logo || ""
  );
  const [clientLogo, setClientLogo] = useState("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const { isDesktop } = useUserContext();

  const handleDeleteLogo = event => {
    event.preventDefault();

    setClientLogo("");
    setClientLogoUrl("");
  };

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
              <h6 className="text-base font-extrabold">Edit Client Details</h6>
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
              clientData={client}
              clientLogo={clientLogo}
              clientLogoUrl={clientLogoUrl}
              formType="edit"
              handleDeleteLogo={handleDeleteLogo}
              setApiError={setApiError}
              setClientLogo={setClientLogo}
              setClientLogoUrl={setClientLogoUrl}
              setShowEditDialog={setShowEditDialog}
            />
          </div>
        </div>
      </div>
    </div>
  ) : (
    <MobileClientForm
      apiError={apiError}
      clientData={client}
      clientLogo={clientLogo}
      clientLogoUrl={clientLogoUrl}
      formType="Edit"
      handleDeleteLogo={handleDeleteLogo}
      setApiError={setApiError}
      setClientLogo={setClientLogo}
      setClientLogoUrl={setClientLogoUrl}
      setShowDialog={setShowEditDialog}
      setShowEditDialog={setShowEditDialog}
      setSubmitting={setSubmitting}
      submitting={submitting}
    />
  );
};

export default EditClient;
