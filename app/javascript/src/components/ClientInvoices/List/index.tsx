import React from "react";

import { useUserContext } from "context/UserContext";

import NoInvoices from "./NoInvoices";
import Table from "./Table";

const List = ({ invoices }: Iprops) => {
  const { isDesktop } = useUserContext();

  if (invoices.length) {
    return (
      <div
        className={`${
          isDesktop ? null : "overflow-x-scroll"
        } relative flex flex-col items-stretch`}
      >
        <Table invoices={invoices} />
      </div>
    );
  }

  return <NoInvoices />;
};

interface Iprops {
  invoices: [];
}

export default List;
