import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import invoicesApi from "apis/invoices";
import dayjs from "dayjs";
import { X, FloppyDisk, PaperPlaneTilt } from "phosphor-react";

const Header = ({
  client,
  invoiceNumber,
  reference,
  issueDate,
  dueDate,
  invoiceLineItems,
  amount,
  amountDue,
  amountPaid,
  discount,
  tax,
  setShowSendInvoiceModal
}) => {

  const navigate = useNavigate();
  const getIssuedDate = dayjs(issueDate).format("DD.MM.YYYY");
  const getDueDate = dayjs(dueDate).format("DD.MM.YYYY");

  const saveInvoice = () => {
    invoicesApi.post({
      client_id: client.value,
      invoice_number: invoiceNumber,
      reference: reference,
      issue_date: getIssuedDate,
      due_date: getDueDate,
      amount_due: amountDue,
      amount_paid: amountPaid,
      amount: amount,
      discount: discount,
      tax: tax,
      invoice_line_items_attributes: invoiceLineItems.map(ilt => ({
        name: `${ilt.first_name} ${ilt.last_name}`,
        description: ilt.description,
        date: ilt.date,
        rate: ilt.rate,
        quantity: ilt.qty,
        timesheet_entry_id: ilt.timesheet_entry_id
      }))
    })
      .then(() => navigate("/invoices"))
      .catch();
  };

  const handleSendInvoice = () => {
    setShowSendInvoiceModal(true);
  };

  return (
    <React.Fragment>
      <ToastContainer />
      <div className="sm:flex mt-6 mb-3 sm:items-center sm:justify-between">
        <h2 className="header__title font-bold">Generate Invoice</h2>

        <div className="flex w-2/5">
          <Link
            to="/invoices"
            type="button"
            className="header__button w-1/3 p-0"
          >
            <X size={12} />
            <span className="ml-2 inline-block">CANCEL</span>
          </Link>
          <button
            type="button"
            className="header__button bg-miru-han-purple-1000 text-white w-1/3 p-0 hover:text-white"
            onClick={saveInvoice}
          >
            <FloppyDisk size={18} color="white" />
            <span className="ml-2 inline-block">SAVE</span>
          </button>
          <button
            type="button"
            onClick={handleSendInvoice}
            className="header__button bg-miru-han-purple-1000 text-white w-1/3 p-0 hover:text-white"
          >
            <PaperPlaneTilt size={18} color="White" />
            <span className="ml-2 inline-block">SEND TO</span>
          </button>
        </div>
      </div>
    </React.Fragment>
  );
};

export default Header;
