import React from "react";

import { useNavigate } from "react-router-dom";

import invoicesApi from "apis/invoices";
import ConfirmDialog from "common/Modal/ConfirmDialog";

interface IProps {
  invoice: any;
  setShowDeleteDialog: any;
  fetchInvoices?: any;
}

const DeleteInvoice = ({ invoice, setShowDeleteDialog, fetchInvoices }: IProps) => {
  const navigate = useNavigate();
  const destroyInvoice = async invoice => {
    try {
      await invoicesApi.destroy(invoice);
      setShowDeleteDialog(false);
      if (fetchInvoices) {
        fetchInvoices();
      } else {
        navigate("/invoices");
      }
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <ConfirmDialog
      title='Delete Invoice'
      open={true}
      onClose={() => setShowDeleteDialog(false) }
      onConfirm={ () => destroyInvoice(invoice) }
      yesButtonText="DELETE"
      noButtonText="CANCEL"
    >
      Are you sure you want to delete this invoice?
      <b className="font-bold"></b> This action cannot
      be reversed.
    </ConfirmDialog>
  );
};
export default DeleteInvoice;
