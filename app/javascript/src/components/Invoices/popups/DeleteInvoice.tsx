import React from "react";

import { invoicesApi } from "apis/api";
import { useNavigate } from "react-router-dom";
import { Modal, Button } from "StyledComponents";

interface IProps {
  invoice: any;
  setShowDeleteDialog: any;
  showDeleteDialog: boolean;
  fetchInvoices?: any;
}

const DeleteInvoice = ({
  invoice,
  setShowDeleteDialog,
  fetchInvoices,
  showDeleteDialog,
}: IProps) => {
  const navigate = useNavigate();
  const destroyInvoice = async invoice => {
    await invoicesApi.destroy(invoice);
    setShowDeleteDialog(false);
    if (fetchInvoices) {
      fetchInvoices();
    } else {
      navigate("/invoices");
    }
  };

  return (
    <Modal
      customStyle="sm:my-8 sm:w-full sm:max-w-lg sm:align-middle"
      isOpen={showDeleteDialog}
      onClose={() => setShowDeleteDialog(false)}
    >
      <div className="mb-8 mt-4 flex-col">
        <h6 className="mb-2 text-2xl font-bold">Delete Invoice</h6>
        <p className="mt-2 font-normal">
          Are you sure you want to delete this invoice?
          <b className="font-bold" /> This action cannot be reversed.
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
            destroyInvoice(invoice);
          }}
        >
          DELETE
        </Button>
      </div>
    </Modal>
  );
};
export default DeleteInvoice;
