import React, { useState } from "react";

import { XIcon } from "miruIcons";
import { Modal } from "StyledComponents";

import { useUserContext } from "context/UserContext";

import ClientForm from "../ClientForm";
import MobileClientForm from "../ClientForm/MobileClientForm";

interface IEditClient {
  setShowEditDialog: any;
  client: any;
  showEditDialog: boolean;
}

const EditClient = ({
  setShowEditDialog,
  client,
  showEditDialog,
}: IEditClient) => {
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
    <Modal
      customStyle="sm:my-8 sm:w-full sm:max-w-lg sm:align-middle overflow-visible"
      isOpen={showEditDialog}
      onClose={() => setShowEditDialog(false)}
    >
      <div className="flex items-center justify-between">
        <h6 className="text-base font-extrabold">Edit Client Details</h6>
        <button
          className="modal__button"
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
        setSubmitting={setSubmitting}
        submitting={submitting}
      />
    </Modal>
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
