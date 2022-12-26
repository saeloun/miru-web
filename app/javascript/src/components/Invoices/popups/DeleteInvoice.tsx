import React from "react";

import { useNavigate } from "react-router-dom";

import invoicesApi from "apis/invoices";

interface IProps {
  invoice: any;
  setShowDeleteDialog: any;
  fetchInvoices?: any;
}

const DeleteInvoice = ({
  invoice,
  setShowDeleteDialog,
  fetchInvoices,
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
    <div className="flex items-center justify-center px-4">
      <div
        className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-10 flex items-start justify-center overflow-auto"
        style={{
          backgroundColor: "rgba(29, 26, 49, 0.6)",
        }}
      >
        <div className="relative h-full w-full px-4 md:flex md:items-center md:justify-center">
          <div className="modal-width transform rounded-lg bg-white px-6 pb-6 shadow-xl transition-all sm:max-w-md sm:align-middle">
            <div className="my-8 flex-col">
              <h6 className="mb-2 text-2xl font-bold">Delete Invoice</h6>
              <p className="mt-2 font-normal">
                Are you sure you want to delete this invoice?
                <b className="font-bold" /> This action cannot be reversed.
              </p>
            </div>
            <div className="flex justify-between">
              <button
                className="button__bg_transparent"
                onClick={() => {
                  setShowDeleteDialog(false);
                }}
              >
                CANCEL
              </button>
              <button
                className="button__bg_purple"
                onClick={() => {
                  destroyInvoice(invoice);
                }}
              >
                DELETE
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DeleteInvoice;
