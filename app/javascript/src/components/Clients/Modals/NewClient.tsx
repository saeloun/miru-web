import React, { useEffect, useState } from "react";

import { XIcon } from "miruIcons";
import { Modal } from "StyledComponents";

import clientApi from "apis/clients";
import { useUserContext } from "context/UserContext";

import ClientForm from "../ClientForm";
import MobileClientForm from "../ClientForm/MobileClientForm";

const NewClient = ({
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
  const [usersWithClientRole, setUsersWithClientRole] = useState([]);

  const handleDeleteLogo = () => {
    setClientLogo("");
    setClientLogoUrl("");
  };

  const fetchUsersWithClientroles = async (val = "week") => {
    const res = await clientApi.get(`?time_frame=${val}`);
    setUsersWithClientRole(res.data.users_not_in_client_members);
  };

  useEffect(() => {
    fetchUsersWithClientroles();
  }, []);

  const { isDesktop } = useUserContext();

  return isDesktop ? (
    <Modal
      customStyle="sm:my-8 sm:w-full sm:max-w-lg sm:align-middle overflow-visible"
      isOpen={showDialog}
      onClose={() => setShowDialog(false)}
    >
      <div className="flex items-center justify-between">
        <h6 className="text-base font-extrabold">Add New Client</h6>
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
      <ClientForm
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
        usersWithClientRole={usersWithClientRole}
      />
    </Modal>
  ) : (
    <MobileClientForm
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

export default NewClient;
