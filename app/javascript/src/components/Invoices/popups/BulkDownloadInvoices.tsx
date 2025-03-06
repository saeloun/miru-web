import React, { useEffect, useState } from "react";

import dayjs from "dayjs";
import { DownloadSimpleIcon, CheckCircleIcon } from "miruIcons";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import { v4 as uuidv4 } from "uuid";

import invoicesApi from "apis/invoices";

const BulkDownloadInvoices = ({
  selectedInvoices,
  downloading,
  setDownloading,
  selectedInvoiceCounter,
  setSelectedInvoiceCounter,
}) => {
  const [downloadId, setDownloadId] = useState(null);
  const [downloadStatus, setDownloadStatus] = useState({
    label: "Preparing download...",
    icon: null,
  });
  const [counter, setCounter] = useState(0);
  const [isPolling, setIsPolling] = useState(false);

  const sendInvoiceIds = async () => {
    const payload = {
      bulk_invoices: {
        download_id: downloadId,
        invoice_ids: selectedInvoices,
      },
    };
    const queryString = new URLSearchParams();

    Object.entries(payload.bulk_invoices).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(item => {
          queryString.append(`bulk_invoices[${key}][]`, item);
        });
      } else {
        queryString.append(`bulk_invoices[${key}]`, value);
      }
    });
    try {
      await invoicesApi.bulkDownloadInvoices(queryString.toString());
      setDownloading(true);
      setTimeout(() => setIsPolling(true), 3000);
    } catch {
      setDownloadStatus({ label: "Something went wrong!", icon: "" });
      setDownloading(false);
      setIsPolling(false);
    }
  };

  const pollDownloadStatus = async () => {
    if (!isPolling) return;

    try {
      const response = await invoicesApi.getDownloadStatus(downloadId);
      if (response.data.status === "completed") {
        setIsPolling(false);
        handleDownloadComplete(response.data.file_url);
      } else if (response.data.status === "processing") {
        setCounter(prevCounter =>
          Math.min(prevCounter + 1, selectedInvoiceCounter)
        );
        setTimeout(pollDownloadStatus, 2000);
      } else {
        setIsPolling(false);
        setDownloadStatus({
          label: "Download failed. Please try again.",
          icon: "",
        });
      }
    } catch {
      setIsPolling(false);
      setDownloadStatus({ label: "Something went wrong!", icon: "" });
    }
  };

  const handleDownloadComplete = fileUrl => {
    setDownloadStatus({
      label: "Downloading files...",
      icon: <DownloadSimpleIcon className="text-white" />,
    });

    setTimeout(() => {
      const link = document.createElement("a");
      const fileName = `Invoices-${dayjs().format("DD-MM-YY-h:mm")}`;
      link.download = fileName;
      link.href = fileUrl;
      document.body.appendChild(link);
      link.click();
      setDownloading(false);
      setDownloadStatus({
        label: "Download Complete",
        icon: <CheckCircleIcon className="text-white" />,
      });
    }, 5000);
  };

  useEffect(() => {
    if (!downloading) {
      setDownloadId(uuidv4());
    }
  }, []);

  useEffect(() => {
    if (selectedInvoices.length > 0 && downloadId) {
      sendInvoiceIds();
      setSelectedInvoiceCounter(selectedInvoices.length);
    }
  }, [downloadId, selectedInvoices]);

  useEffect(() => {
    if (isPolling) {
      pollDownloadStatus();
    }
  }, [isPolling]);

  useEffect(() => {
    if (isPolling) {
      const progress = Math.min(counter, selectedInvoiceCounter);
      setDownloadStatus({
        label: `Preparing download...${counter}/${selectedInvoiceCounter}`,
        icon: (
          <CircularProgressbar
            strokeWidth={10}
            value={(progress / selectedInvoiceCounter) * 100}
            styles={buildStyles({
              textColor: "white",
              textSize: "10px",
              pathColor: "white",
            })}
          />
        ),
      });
    }
  }, [counter, isPolling, selectedInvoiceCounter]);

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
