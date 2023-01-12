import React, { useEffect, useState } from "react";

import dayjs from "dayjs";
import { DownloadSimpleIcon, CheckCircleIcon } from "miruIcons";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import { v4 as uuidv4 } from "uuid";

import invoicesApi from "apis/invoices";

import consumer from "./consumer";

const BulkDownloadInvoices = ({
  selectedInvoices,
  downloading,
  received,
  connected,
  counter,
  setConnected,
  setDownloading,
  setReceived,
  setCounter,
  selectedInvoiceCounter,
  setSelectedInvoiceCounter,
}) => {
  const [downloadId, setDownloadId] = useState(null);
  const [downloadStatus, setDownloadStatus] = useState<any>({
    label: "Preparing download...",
    icon: "",
  });
  let channel = null;

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

    channel = consumer.subscriptions.create(
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
      if (counter < selectedInvoiceCounter) {
        setCounter(counter + 1);
      }
    }
  }, 2000);

  useEffect(() => {
    if (!downloading) {
      setDownloadId(uuidv4());
      setReceived(null);
    }
  }, []);

  useEffect(() => {
    if (selectedInvoices.length > 0 && downloadId) {
      sendInvoiceIds();
      setDownloading(true);
      setSelectedInvoiceCounter(selectedInvoices.length);
    }
  }, [downloadId]);

  useEffect(() => {
    if (received && downloading) {
      const status = {
        label: "Downloading files...",
        icon: <DownloadSimpleIcon className="text-white" />,
      };
      setDownloadStatus(status);
      setTimeout(() => {
        const link = document.createElement("a");
        const fileName = `Invoices-${dayjs().format("DD-MM-YY-h:mm")}`;
        link.download = fileName;
        link.href = received.file_url;
        document.body.appendChild(link);
        link.click();
        setDownloading(false);
        channel && channel.unsubscribe();
        setDownloadStatus({
          label: "Download Complete",
          icon: <CheckCircleIcon className="text-white" />,
        });
        clearTimeout(Timer);
      }, 5000);
    } else if (connected || downloading) {
      const status = {
        label: `Preparing download...${counter}/${selectedInvoiceCounter}`,
        icon: (
          <CircularProgressbar
            strokeWidth={10}
            value={(counter / selectedInvoiceCounter) * 100}
            styles={buildStyles({
              textColor: "white",
              textSize: "10px",
              pathColor: "white",
            })}
          />
        ),
      };
      setDownloadStatus(status);
    } else {
      setDownloadStatus({ label: "Something went wrong!" });
    }
  }, [counter, received, connected]);

  return (
    <div className="fixed right-20 bottom-16 flex items-center justify-center rounded bg-miru-dark-purple-1000 p-4">
      <div className="mr-2.5 h-4 w-4 bg-miru-dark-purple-1000">
        {downloadStatus.icon}
      </div>
      <span className="text-sm font-medium leading-5 text-miru-dark-purple-100">
        {downloadStatus.label}
      </span>
    </div>
  );
};

export default BulkDownloadInvoices;
