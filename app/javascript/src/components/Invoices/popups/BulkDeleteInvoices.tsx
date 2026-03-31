import React from "react";

import { invoicesApi } from "apis/api";
import { Modal, Button } from "StyledComponents";
import { i18n } from "../../../i18n";

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
        <h6 className="mb-2 text-2xl font-bold">{i18n.t("invoices.deleteInvoices")}</h6>
        <p className="mt-2 font-normal">
          {i18n.t("invoices.deleteInvoicesConfirm")}
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-0">
        <Button
          className="w-full sm:mr-2 sm:w-1/2"
          size="medium"
          style="secondary"
          onClick={() => {
            setShowBulkDeleteDialog(false);
          }}
        >
          {i18n.t("cancel").toUpperCase()}
        </Button>
        <Button
          className="w-full sm:ml-2 sm:w-1/2"
          size="medium"
          style="primary"
          onClick={() => {
            destroyInvoices(invoices_ids);
          }}
        >
          {i18n.t("delete").toUpperCase()}
        </Button>
      </div>
    </Modal>
  );
};
export default BulkDeleteInvoices;
