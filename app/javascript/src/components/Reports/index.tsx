import React, { useState, useEffect, useRef } from "react";

import { setAuthHeaders, registerIntercepts } from "apis/axios";
import reports from "apis/reports";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Container from "./Container";
import EntryContext from "./context/EntryContext";

import Filters from "./Filters";
import Header from "./Header";

import { ITimeEntry } from "./interface";

// declare global {
//   interface Navigator {
//     msSaveBlob?: (blob: any, defaultName?: string) => boolean;
//   }
// }

const Reports = () => {
  const [timeEntries, setTimeEntries] = useState<Array<ITimeEntry>>([]);
  const [isFilterVisible, setFilterVisibilty] = useState<boolean>(false);
  const printRef = useRef<HTMLTableElement>(null);

  const fetchTimeEntries = async () => {
    const res = await reports.get();
    if (res.status == 200) {
      setTimeEntries(res.data.entries);
    }
  };

  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
    fetchTimeEntries();
  }, []);

  const downloadPdf = async () => {
    const element = printRef.current;
    const canvas = await html2canvas(element);
    const data = canvas.toDataURL("image/png");

    const pdf = new jsPDF();
    const imgProperties = pdf.getImageProperties(data);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProperties.height * pdfWidth) / imgProperties.width;
    pdf.addImage(data, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("print.pdf");
  };

  // const exportToCsv = (
  //   filename: string,
  //   rows: object[],
  //   headers?: string[]
  // ): void => {
  //   if (!rows || !rows.length) return;

  //   const separator = ",";
  //   const keys: string[] = Object.keys(rows[0]);
  //   let columnHeaders: string[];

  //   if (headers) {
  //     columnHeaders = headers;
  //   } else {
  //     columnHeaders = keys;
  //   }

  //   const csvContent =
  //     "sep=,\n" +
  //     columnHeaders.join(separator) +
  //     "\n" +
  //     rows
  //       .map((row) =>
  //         keys
  //           .map((k) => {
  //             let cell = row[k] === null || row[k] === undefined ? "" : row[k];
  //             cell =
  //               cell instanceof Date
  //                 ? cell.toLocaleString()
  //                 : cell.toString().replace(/"/g, '""');

  //             if (navigator.msSaveBlob) {
  //               // eslint-disable-next-line no-control-regex
  //               cell = cell.replace(/[^\x00-\x7F]/g, "");
  //             }
  //             if (cell.search(/("|,|\n)/g) >= 0) {
  //               cell = `"${cell}"`;
  //             }
  //             return cell;
  //           })
  //           .join(separator)
  //       )
  //       .join("\n");

  //   const blob = new Blob([csvContent], { type: "text/csv;charset=utf8;" });
  //   if (navigator.msSaveBlob) {
  //     navigator.msSaveBlob(blob, filename);
  //   }
  // };

  return (
    <div>
      <EntryContext.Provider value={{ entries: timeEntries }}>
        <Header
          setFilterVisibilty={setFilterVisibilty}
          isFilterVisible={isFilterVisible}
          downloadPdf={downloadPdf}
          // downloadCsv={exportToCsv}
        />
        <Container ref={printRef} />
        {isFilterVisible && <Filters setFilterVisibilty={setFilterVisibilty} />}
      </EntryContext.Provider>
    </div>
  );
};

export default Reports;
