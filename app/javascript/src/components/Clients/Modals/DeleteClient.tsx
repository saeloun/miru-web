import React from "react";

import { useNavigate } from "react-router-dom";

import clientApi from "apis/clients";
import ConfirmDialog from "common/Modal/ConfirmDialog";

interface IProps {
  client: any;
  setShowDeleteDialog: any;
}

const DeleteClient = ({ client, setShowDeleteDialog }: IProps) => {

  const navigate = useNavigate();

  const deleteClient = async client => {
    await clientApi.destroy(client.id);
    setShowDeleteDialog(false);
    window.location.pathname == "/clients" ? navigate(0) : navigate("/clients");
  };
  return (
    <ConfirmDialog
      title='Delete Client'
      open={true}
      onClose={() => setShowDeleteDialog(false) }
      onConfirm={ () => deleteClient(client) }
      yesButtonText="DELETE"
      noButtonText="CANCEL"
    >
      Are you sure you want to delete the client{" "}
      <b className="font-bold">{client.name}</b>? This action cannot
      be reversed.
    </ConfirmDialog>
  );
};

export default DeleteClient;
