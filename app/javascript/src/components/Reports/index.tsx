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

  return (
    <div>
      <EntryContext.Provider value={{ entries: timeEntries }}>
        <Header
          setFilterVisibilty={setFilterVisibilty}
          isFilterVisible={isFilterVisible}
          downloadPdf={downloadPdf}
        />
        <Container ref={printRef} />
        {isFilterVisible && <Filters setFilterVisibilty={setFilterVisibilty} />}
      </EntryContext.Provider>
    </div>
  );
};

export default Reports;
