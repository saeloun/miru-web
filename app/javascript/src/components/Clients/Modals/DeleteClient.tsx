import React from "react";

import { clientApi } from "apis/api";
import { useNavigate } from "react-router-dom";
import { Modal, Button } from "StyledComponents";
import { i18n } from "../../../i18n";

interface IProps {
  client: any;
  setShowDeleteDialog: any;
  showDeleteDialog: boolean;
}

const DeleteClient = ({
  client,
  showDeleteDialog,
  setShowDeleteDialog,
}: IProps) => {
  const navigate = useNavigate();

  const deleteClient = async client => {
    await clientApi.destroy(client.id);
    setShowDeleteDialog(false);
    if (window.location.pathname === "/clients") {
      navigate(0);
    } else {
      navigate("/clients");
    }
  };

  return (
    <Modal
      customStyle="sm:my-8 sm:w-full sm:max-w-lg sm:align-middle"
      isOpen={showDeleteDialog}
      onClose={() => setShowDeleteDialog(false)}
    >
      <div className="flex-col">
        <h6 className="text-2xl font-bold">{i18n.t("clients.deleteClient")}</h6>
        <p className="mt-4 mb-10 font-normal xsm:text-sm">
          {i18n.t("clients.deleteClientConfirm", { name: client.name })}
        </p>
      </div>
      <div className="flex justify-between">
        <Button
          className="mr-2 w-1/2"
          size="medium"
          style="secondary"
          onClick={() => {
            setShowDeleteDialog(false);
          }}
        >
          {i18n.t("cancel").toUpperCase()}
        </Button>
        <Button
          className="ml-2 w-1/2"
          size="medium"
          style="primary"
          onClick={() => {
            deleteClient(client);
          }}
        >
          {i18n.t("delete").toUpperCase()}
        </Button>
      </div>
    </Modal>
  );
};

export default DeleteClient;
