import React from "react";

import { PencilIcon } from "miruIcons";
import { Link } from "react-router-dom";

const EditButton = ({ editInvoiceLink }) => (
  <div className="edit-button-container mx-1 flex flex-col justify-items-center">
    <Link
      className="flex h-10 w-32 flex-row justify-center rounded border border-miru-han-purple-1000"
      to={editInvoiceLink}
      type="button"
    >
      <div className="flex flex-row items-center justify-between self-center">
        <div className="mr-1">
          <PencilIcon color="#5B34EA" size={16} weight="bold" />
        </div>
        <p className="ml-1 text-base font-bold tracking-widest text-miru-han-purple-1000">
          EDIT
        </p>
      </div>
    </Link>
  </div>
);

export default EditButton;
