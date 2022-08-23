import React from "react";

import { Pencil } from "phosphor-react";
import { Link } from "react-router-dom";

const EditButton = ({ editInvoiceLink }) => (
  <div className="flex flex-col justify-items-center edit-button-container mx-1">
    <Link
      to={editInvoiceLink}
      type="button"
      className="flex flex-row justify-center border border-miru-han-purple-1000 rounded h-10 w-32"
    >
      <div className="self-center flex flex-row justify-between items-center">
        <div className="mr-1">
          <Pencil size={16} color="#5B34EA" weight="bold"/>
        </div>
        <p className="font-bold tracking-widest text-base text-miru-han-purple-1000 ml-1">EDIT</p>
      </div>
    </Link>
  </div>
);

export default EditButton;
