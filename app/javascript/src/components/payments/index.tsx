import React from "react";
import Pagination from "common/Pagination";
import Header from "./Header";
import Table from "./Table/index";

const Payments = () => {
  const payments = [
    {
      invoice_number: "1",
      client: "Facebook",
      time: "1:20 PM",
      transaction_date: "2022-04-12",
      transaction_type: "Payment_Stripe_Auto_Succes",
      amount: "300",
      status: "paid"
    },
    {
      invoice_number: "2",
      client: "Slack",
      time: "1:20 PM",
      transaction_date: "2022-04-12",
      transaction_type: "Payment_Stripe_Auto_Succes",
      amount: "300",
      status: "paid"
    },
    {
      invoice_number: "3",
      client: "Upwork",
      time: "1:20 PM",
      transaction_date: "2022-04-12",
      transaction_type: "Payment_Stripe_Auto_Failed",
      amount: "300",
      status: "Failed"
    },
    {
      invoice_number: "4",
      client: "Youtube",
      time: "1:20 PM",
      transaction_date: "2022-04-12",
      transaction_type: "Payment_Stripe_Auto_Succes",
      amount: "300",
      status: "paid"
    },
    {
      invoice_number: "5",
      client: "Reddit",
      time: "1:20 PM",
      transaction_date: "2022-04-12",
      transaction_type: "Payment_Stripe_Auto_failure",
      amount: "300",
      status: "Failed"
    },
    {
      invoice_number: "5",
      client: "Reddit",
      time: "1:20 PM",
      transaction_date: "2022-04-12",
      transaction_type: "Payment_Stripe_Auto_failure",
      amount: "300",
      status: "Failed"
    },
    {
      invoice_number: "5",
      client: "Reddit",
      time: "1:20 PM",
      transaction_date: "2022-04-12",
      transaction_type: "Payment_Stripe_Auto_failure",
      amount: "300",
      status: "Failed"
    },
    {
      invoice_number: "5",
      client: "Reddit",
      time: "1:20 PM",
      transaction_date: "2022-04-12",
      transaction_type: "Payment_Stripe_Auto_failure",
      amount: "300",
      status: "Failed"
    },
    {
      invoice_number: "5",
      client: "Reddit",
      time: "1:20 PM",
      transaction_date: "2022-04-12",
      transaction_type: "Payment_Stripe_Auto_failure",
      amount: "300",
      status: "Failed"
    }
  ];

  return (
    <div className="flex-col">
      <Header />
      <Table payments={payments} />
      <Pagination
        pagy={{
          count: 3,
          in: 3,
          items: 20,
          last: 1,
          next: null,
          page: 1,
          pages: 3,
          prev: null,
          scaffoldUrl: ""
        }}
        params=""
        setParams=""
      />
    </div>
  );
};

export default Payments;
