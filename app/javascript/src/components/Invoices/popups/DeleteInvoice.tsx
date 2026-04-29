import React from "react";

import { invoicesApi } from "apis/api";
import { useNavigate } from "react-router-dom";
import { Modal, Button } from "StyledComponents";
import { i18n } from "../../../i18n";

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
        <h6 className="mb-2 text-2xl font-bold">
          {i18n.t("invoices.deleteInvoice")}
        </h6>
        <p className="mt-2 font-normal">
          {i18n.t("invoices.deleteInvoiceConfirm")}
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-0">
        <Button
          className="w-full sm:mr-2 sm:w-1/2"
          size="medium"
          style="secondary"
          onClick={() => {
            setShowDeleteDialog(false);
          }}
        >
          {i18n.t("cancel").toUpperCase()}
        </Button>
        <Button
          className="w-full sm:ml-2 sm:w-1/2"
          size="medium"
          style="primary"
          onClick={() => {
            destroyInvoice(invoice);
          }}
        >
          {i18n.t("delete").toUpperCase()}
        </Button>
      </div>
    </Modal>
  );
};
export default DeleteInvoice;
