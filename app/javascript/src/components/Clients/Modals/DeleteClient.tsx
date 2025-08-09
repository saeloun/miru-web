import React from "react";

import clientApi from "apis/clients";
import { useNavigate } from "react-router-dom";
import { Modal, Button } from "StyledComponents";

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
    window.location.pathname == "/clients" ? navigate(0) : navigate("/clients");
  };

  return (
    <Modal
      customStyle="sm:my-8 sm:w-full sm:max-w-lg sm:align-middle"
      isOpen={showDeleteDialog}
      onClose={() => setShowDeleteDialog(false)}
    >
      <div className="flex-col">
        <h6 className="text-2xl font-bold">Delete Client</h6>
        <p className="mt-4 mb-10 font-normal xsm:text-sm">
          Are you sure you want to delete client{" "}
          <b className="font-bold">{client.name}</b>? This action cannot be
          reversed.
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
          CANCEL
        </Button>
        <Button
          className="ml-2 w-1/2"
          size="medium"
          style="primary"
          onClick={() => {
            deleteClient(client);
          }}
        >
          DELETE
        </Button>
      </div>
    </Modal>
  );
};

export default DeleteClient;
