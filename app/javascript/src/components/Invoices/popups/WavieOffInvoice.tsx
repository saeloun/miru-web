import React from "react";

import { invoicesApi } from "apis/api";
import { useNavigate } from "react-router-dom";
import { Modal, Button } from "StyledComponents";

interface IProps {
  invoice: any;
  setShowWavieDialog: any;
  showWavieDialog: boolean;
  fetchInvoices?: any;
  invoiceNumber?: any;
}

const WavieOffInvoice = ({
  invoice,
  setShowWavieDialog,
  fetchInvoices,
  showWavieDialog,
  invoiceNumber,
}: IProps) => {
  const navigate = useNavigate();
  const wavieInvoice = async invoice => {
    await invoicesApi.waiveInvoice(invoice);
    setShowWavieDialog(false);
    if (fetchInvoices) {
      fetchInvoices();
    } else {
      navigate("/invoices");
    }
  };

  return (
    <Modal
      customStyle="sm:my-8 sm:w-full sm:max-w-lg sm:align-middle"
      isOpen={showWavieDialog}
      onClose={() => setShowWavieDialog(false)}
    >
      <div className="mb-8 mt-4 flex-col">
        <h6 className="mb-2 text-2xl font-bold">Waive Off Invoice</h6>
        <p className="mt-2 font-normal">
          Are you sure you want to waive off invoice{" "}
          <b className="font-bold">#{invoiceNumber}</b>? This action cannot be
          reversed.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-0">
        <Button
          className="w-full sm:mr-2 sm:w-1/2"
          size="medium"
          style="secondary"
          onClick={() => {
            setShowWavieDialog(false);
          }}
        >
          CANCEL
        </Button>
        <Button
          className="w-full sm:ml-2 sm:w-1/2"
          size="medium"
          style="primary"
          onClick={() => {
            wavieInvoice(invoice);
          }}
        >
          Waive Off
        </Button>
      </div>
    </Modal>
  );
};
export default WavieOffInvoice;
