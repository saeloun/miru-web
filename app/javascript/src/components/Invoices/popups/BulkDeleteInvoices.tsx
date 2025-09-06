import React from "react";

import { invoicesApi } from "apis/api";
import { Modal, Button } from "StyledComponents";

interface IProps {
  invoices_ids: any;
  setShowBulkDeleteDialog: any;
  showBulkDeleteDialog: boolean;
  fetchInvoices: any;
}

const BulkDeleteInvoices = ({
  invoices_ids,
  setShowBulkDeleteDialog,
  showBulkDeleteDialog,
  fetchInvoices,
}: IProps) => {
  const destroyInvoices = async invoices_ids => {
    await invoicesApi.destroyBulk({ invoices_ids });
    setShowBulkDeleteDialog(false);
    fetchInvoices();
  };

  return (
    <Modal
      customStyle="sm:my-8 sm:w-full sm:max-w-lg sm:align-middle"
      isOpen={showBulkDeleteDialog}
      onClose={() => {
        setShowBulkDeleteDialog(false);
      }}
    >
      <div className="mb-8 mt-4 flex-col">
        <h6 className="mb-2 text-2xl font-bold">Delete Invoices</h6>
        <p className="mt-2 font-normal">
          Are you sure you want to delete these invoice?
          <b className="font-bold" /> This action cannot be reversed.
        </p>
      </div>
      <div className="flex justify-between">
        <Button
          className="mr-2 w-1/2"
          size="medium"
          style="secondary"
          onClick={() => {
            setShowBulkDeleteDialog(false);
          }}
        >
          CANCEL
        </Button>
        <Button
          className="ml-2 w-1/2"
          size="medium"
          style="primary"
          onClick={() => {
            destroyInvoices(invoices_ids);
          }}
        >
          DELETE
        </Button>
      </div>
    </Modal>
  );
};
export default BulkDeleteInvoices;
