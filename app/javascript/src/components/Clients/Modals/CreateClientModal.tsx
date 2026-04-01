import React, { useState } from "react";

import { useUserContext } from "context/UserContext";
import { XIcon } from "miruIcons";
import { Modal } from "StyledComponents";
import { i18n } from "../../../i18n";

import ClientEditor from "../ClientForm/ClientEditor";
import MobileClientEditor from "../ClientForm/MobileClientEditor";

const CreateClientModal = ({
  setnewClient,
  clientData,
  setClientData,
  clientLogoUrl,
  setClientLogoUrl,
  clientLogo,
  setClientLogo,
  setShowDialog,
  showDialog,
}) => {
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleDeleteLogo = () => {
    setClientLogo("");
    setClientLogoUrl("");
  };

  const { isDesktop } = useUserContext();

  return isDesktop ? (
    <Modal
      customStyle="sm:my-8 sm:w-full sm:max-w-lg sm:align-middle overflow-visible"
      isOpen={showDialog}
      onClose={() => setShowDialog(false)}
    >
      <div className="flex items-center justify-between">
        <h6 className="text-base font-extrabold">
          {i18n.t("clients.addNewClient")}
        </h6>
        <button
          className="modal__button"
          type="button"
          onClick={() => {
            setnewClient(false);
            setShowDialog(false);
          }}
        >
          <XIcon color="#CDD6DF" size={16} weight="bold" />
        </button>
      </div>
      <ClientEditor
        clientData={clientData}
        clientLogo={clientLogo}
        clientLogoUrl={clientLogoUrl}
        handleDeleteLogo={handleDeleteLogo}
        setClientData={setClientData}
        setClientLogo={setClientLogo}
        setClientLogoUrl={setClientLogoUrl}
        setSubmitting={setSubmitting}
        setnewClient={setnewClient}
        submitting={submitting}
      />
    </Modal>
  ) : (
    <MobileClientEditor
      clientData={clientData}
      clientLogo={clientLogo}
      clientLogoUrl={clientLogoUrl}
      handleDeleteLogo={handleDeleteLogo}
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

export default CreateClientModal;
