import React from "react";

import { clientMembersApi } from "apis/api";
import { Modal, Button } from "StyledComponents";

interface IProps {
  contact: any;
  client: any;
  setShowDeleteDialog: any;
  showDeleteDialog: boolean;
  fetchContacts: any;
}

const DeleteContact = ({
  contact,
  client,
  setShowDeleteDialog,
  showDeleteDialog,
  fetchContacts,
}: IProps) => {
  const deleteContact = async () => {
    const res = await clientMembersApi.destroy(contact.contactId, client.id);
    if (res.status === 200) {
      setShowDeleteDialog(false);
    }
    fetchContacts();
  };

  return (
    <Modal
      customStyle="sm:my-8 sm:w-full sm:max-w-lg sm:align-middle"
      isOpen={showDeleteDialog}
      onClose={() => setShowDeleteDialog(false)}
    >
      <div className="my-8 flex-col">
        <h6 className="mb-2 text-2xl font-bold">Delete Contact</h6>
        <p className="mt-2 font-normal">
          Are you sure you want to delete contact{" "}
          <b className="font-bold">{contact.email}</b>? This action cannot be
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
          onClick={deleteContact}
        >
          DELETE
        </Button>
      </div>
    </Modal>
  );
};

export default DeleteContact;
