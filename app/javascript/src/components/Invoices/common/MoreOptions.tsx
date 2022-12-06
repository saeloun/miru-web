import React from "react";

import { Trash, DownloadSimple } from "phosphor-react";

const MoreOptions = ({ deleteInvoice, downloadInvoice, invoice = null }) => (
  <ul className="absolute right-20 rounded border-2 border-miru-gray-200 bg-white py-2 drop-shadow">
    {downloadInvoice != null && invoice.status != "draft" && (
      <li
        className="flex cursor-pointer items-center py-2.5 px-4 text-miru-han-purple-1000 hover:bg-miru-gray-100"
        onClick={() => downloadInvoice(invoice)}
      >
        <DownloadSimple className="mr-4" size={16} />
        Download
      </li>
    )}
    <li
      className="flex cursor-pointer items-center py-2.5 px-4 text-miru-red-400 hover:bg-miru-gray-100"
      onClick={deleteInvoice}
    >
      <Trash className="mr-4" size={16} />
      Delete
    </li>
  </ul>
);

export default MoreOptions;
