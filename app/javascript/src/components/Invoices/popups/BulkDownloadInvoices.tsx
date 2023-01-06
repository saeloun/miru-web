import React, { useEffect, useState } from "react";

import { DownloadSimpleIcon, CheckCircleIcon } from "miruIcons";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import { v4 as uuidv4 } from "uuid";

import invoicesApi from "apis/invoices";

import consumer from "./consumer";

const BulkDownloadInvoices = ({
  selectedInvoices,
  downloaded,
  setDownloaded,
}) => {
  const [downloadId, setDownloadId] = useState(null);
  const [downloadStatus, setDownloadStatus] = useState<string>(
    "Preparing download..."
  );
  const [connected, setConnected] = useState<boolean>(false);
  const [received, setReceived] = useState<any>(null);
  const [counter, setCounter] = useState<number>(1);

  const sendInvoiceIds = async () => {
    const payload = {
      bulk_invoices: {
        download_id: downloadId,
        invoice_ids: selectedInvoices,
      },
    };

    const objectToQueryString = function (a) {
      let prefix, name;
      const s = [];
      const r20 = /%20/g;
      const add = function (key, value) {
        value =
          typeof value == "function" ? value() : value == null ? "" : value;
        s[s.length] = `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
      };
      if (a instanceof Array) {
        for (name in a) {
          add(name, a[name]);
        }
      } else {
        for (prefix in a) {
          buildParams(prefix, a[prefix], add);
        }
      }
      const output = s.join("&").replace(r20, "+");

      return output;
    };

    function buildParams(prefix, obj, add) {
      let name, i, l;
      const rbracket = /\[\]$/;
      if (obj instanceof Array) {
        for (i = 0, l = obj.length; i < l; i++) {
          if (rbracket.test(prefix)) {
            add(prefix, obj[i]);
          } else {
            buildParams(
              `${prefix}[${typeof obj[i] === "object" ? i : ""}]`,
              obj[i],
              add
            );
          }
        }
      } else if (typeof obj == "object") {
        // Serialize object item.
        for (name in obj) {
          buildParams(`${prefix}[${name}]`, obj[name], add);
        }
      } else {
        // Serialize scalar item.
        add(prefix, obj);
      }
    }

    consumer.subscriptions.create(
      {
        channel: "BulkInvoiceDownloadChannel",
        download_id: downloadId.toString(),
      },
      {
        connected: () => setConnected(true),
        disconnected: () => setConnected(false),
        received: data => {
          setReceived(data);
        },
      }
    );

    const query = objectToQueryString(payload);
    await invoicesApi.bulkDownloadInvoices(query);
  };

  const Timer = setTimeout(() => {
    if (connected) {
      if (counter < selectedInvoices.length) {
        setCounter(counter + 1);
      }
    }
  }, 2000);

  useEffect(() => setDownloadId(uuidv4()), []);

  useEffect(() => {
    sendInvoiceIds();
  }, [downloadId]);

  useEffect(() => {
    if (received) {
      const status = "Downloading files...";
      setDownloadStatus(status);
      setTimeout(() => {
        const link = document.createElement("a");
        link.download = "invoiceBulk";
        link.href = received.file_url;
        document.body.appendChild(link);
        link.click();
        setDownloaded(true);
        setDownloadStatus("Download Complete");
        clearTimeout(Timer);
      }, 5000);
    } else if (connected) {
      const status = `Preparing download...${counter}/${selectedInvoices.length}`;
      setDownloadStatus(status);
    } else {
      const status = `Something went wrong!`;
      setDownloadStatus(status);
    }
  }, [counter, received, connected]);

  return (
    <div className="fixed right-20 bottom-16 flex items-center justify-center rounded bg-miru-dark-purple-1000 p-4">
      <div className="mr-2.5 h-4 w-4 bg-miru-dark-purple-1000">
        {received ? (
          downloaded ? (
            <CheckCircleIcon className="text-white" />
          ) : (
            <DownloadSimpleIcon className="text-white" />
          )
        ) : (
          connected && (
            <CircularProgressbar
              strokeWidth={10}
              value={(counter / selectedInvoices.length) * 100}
              styles={buildStyles({
                textColor: "white",
                textSize: "10px",
                pathColor: "white",
              })}
            />
          )
        )}
      </div>
      <span className="text-sm font-medium leading-5 text-miru-dark-purple-100">
        {downloadStatus}
      </span>
    </div>
  );
};

export default BulkDownloadInvoices;
