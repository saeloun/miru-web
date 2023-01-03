import React, { useEffect, useState } from "react";
import invoicesApi from "apis/invoices";

import consumer from "./consumer";
import qs from "qs";
import { v4 as uuidv4 } from 'uuid';

const BulkDownloadInvoices = ({ selectedInvoices }) => {
  const [downloadId, setDownloadId] = useState(uuidv4()); // eslint-disable-line

  const sendInvoiceIds = async () => {
    var payload = {
      bulk_invoices:{
        download_id: downloadId,
        invoice_ids: selectedInvoices,
        }
    };

var objectToQueryString = function (a) {
  var prefix, s, add, name, r20, output;
  s = [];
  r20 = /%20/g;
  add = function (key, value) {
      // If value is a function, invoke it and return its value
      value = ( typeof value == 'function' ) ? value() : ( value == null ? "" : value );
      s[ s.length ] = encodeURIComponent(key) + "=" + encodeURIComponent(value);
  };
  if (a instanceof Array) {
      for (name in a) {
          add(name, a[name]);
      }
  } else {
      for (prefix in a) {
          buildParams(prefix, a[ prefix ], add);
      }
  }
  output = s.join("&").replace(r20, "+");
  return output;
};
function buildParams(prefix, obj, add) {
  var name, i, l, rbracket;
  rbracket = /\[\]$/;
  if (obj instanceof Array) {
      for (i = 0, l = obj.length; i < l; i++) {
          if (rbracket.test(prefix)) {
              add(prefix, obj[i]);
          } else {
              buildParams(prefix + "[" + ( typeof obj[i] === "object" ? i : "" ) + "]", obj[i], add);
          }
      }
  } else if (typeof obj == "object") {
      // Serialize object item.
      for (name in obj) {
          buildParams(prefix + "[" + name + "]", obj[ name ], add);
      }
  } else {
      // Serialize scalar item.
      add(prefix, obj);
  }
}


      consumer.subscriptions.create(
        {
          channel: "BulkInvoiceDownloadChannel",
          download_id:downloadId.toString()
        },
        {
          connected: () => console.log("connected"), //eslint-disable-line
          disconnected: () => console.log("disconnected"), //eslint-disable-line
          received: data => {
          const url = window.URL.createObjectURL(new Blob([data.content]));
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", `${'bulkInvoices9'}.zip`);
          document.body.appendChild(link);
          link.click();
        }
        }
      );

      const query = objectToQueryString(payload);
      await invoicesApi.bulkDownloadInvoices(query);

  }

  useEffect(() => {
    sendInvoiceIds();
   // setDownloadId(uuidv4());
  }, []);

  const [downloadStatus, setDownloadStatus] = useState<string>("Preparing download..."); //eslint-disable-line

  return (
    <div className="fixed right-20 bottom-16 flex w-56 items-center justify-center rounded bg-miru-dark-purple-1000 p-4">
      <span className="text-base font-medium leading-5 text-miru-dark-purple-100">
        {downloadStatus}
      </span>
    </div>
  );
};

export default BulkDownloadInvoices;
