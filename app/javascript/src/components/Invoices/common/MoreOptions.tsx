import React from "react";

import { Trash, DownloadSimple } from "phosphor-react";

const MoreOptions = ({ deleteInvoice, downloadInvoice, invoice=null }) => (
  <ul className="py-2 absolute right-20 bg-white border-2 rounded border-miru-gray-200 drop-shadow">
    {downloadInvoice != null && invoice.status != "draft" && <li
      onClick={()=>downloadInvoice(invoice)}
      className="flex items-center py-2.5 px-4 cursor-pointer text-miru-han-purple-1000 hover:bg-miru-gray-100"
    >
      <DownloadSimple size={16} className="mr-4" />
      Download
    </li>}
    <li
      onClick={deleteInvoice}
      className="flex items-center py-2.5 px-4 cursor-pointer text-miru-red-400 hover:bg-miru-gray-100"
    >
      <Trash size={16} className="mr-4" />
      Delete
    </li>
  </ul>
);

export default MoreOptions;
