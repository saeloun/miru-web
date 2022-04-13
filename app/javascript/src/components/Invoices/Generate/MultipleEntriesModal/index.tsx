import React from "react";

import Table from "common/Table";
import Footer from "./Footer";
import Header from "./Header";

const MultipleEntriesModal = ({ setShowMultilineModal }) => {

  const tableHeader = [
    {
      Header: "NAME",
      accessor: "col1",
      cssClass: "w-1/5 text-left px-0 py-3"
    },
    {
      Header: "DESCRIPTION",
      accessor: "col2",
      cssClass: "w-3/5 text-left px-0 py-3"
    },
    {
      Header: "DATE",
      accessor: "col3",
      cssClass: "text-right px-0 py-3"
    },
    {
      Header: "TIME",
      accessor: "col4",
      cssClass: "w-1/12 text-right px-0 py-3"
    }
  ];

  const MultipleEntries = [{
    id: 1,
    Name: "Cameron Prichett",
    Description: "I am the description of single entry",
    Date: "23.12.2021",
    Time: "8 Hours",
    cssClass: "px-0 py-3"
  }, {
    id: 2,
    Name: "Chris Patt",
    Description: "I am the description of single entry",
    Date: "23.12.2021",
    Time: "7 Hours",
    cssClass: "px-0 py-3"
  }, {
    id: 3,
    Name: "Jake Sully",
    Description: "I am the description of single entry",
    Date: "23.12.2021",
    Time: "3 Hours",
    cssClass: "px-0 py-3"
  }, {
    id: 4,
    Name: "Robert jnr.",
    Description: "I am the description of single entry",
    Date: "23.12.2021",
    Time: "6 Hours"
  }, {
    id: 5,
    Name: "Paul Rud",
    Description: "I am the description of single entry",
    Date: "23.12.2021",
    Time: "6 Hours",
    cssClass: "px-0 py-3"
  }, {
    id: 6,
    Name: "Chris evans",
    Description: "I am the description of single entry",
    Date: "23.12.2021",
    Time: "6 Hours",
    cssClass: "px-0 py-3"
  }, {
    id: 7,
    Name: "Chris hemsworth",
    Description: "I am the description of single entry",
    Date: "23.12.2021",
    Time: "6 Hours",
    cssClass: "px-0 py-3"
  }, {
    id: 8,
    Name: "Leo decaprio",
    Description: "I am the description of single entry",
    Date: "23.12.2021",
    Time: "6 Hours",
    cssClass: "px-0 py-3"
  }, {
    id: 9,
    Name: "will smith",
    Description: "I am the description of single entry",
    Date: "23.12.2021",
    Time: "6 Hours",
    cssClass: "px-0 py-3"
  }
  ];

  const getTableData = (Entries) => {
    if (Entries) {
      return Entries.map((member) => ({
        col1: <div className='font medium text-sm text-miru-dark-purple-1000 text-left'>{member.Name}</div>,
        col2: <div className='font medium text-xs text-miru-dark-purple-600 text-left'>{member.Description}</div>,
        col3: <div className='font medium text-xs text-miru-dark-purple-1000 text-right'>{member.Date}</div>,
        col4: <div className='font medium text-xs text-miru-dark-purple-1000 text-right'>{member.Time}</div>
      }));
    }
  };

  const tableData = getTableData(MultipleEntries);

  return (
    <div style={{ background: "rgba(29, 26, 49,0.6)" }} className="px-52 py-20 w-full h-full fixed inset-0 flex justify-center z-50">
      <div className="bg-white rounded-lg w-full h-full flex flex-col justify-between">
        <Header
          setShowMultilineModal={setShowMultilineModal}
        />
        <div className='mx-6 h-full overflow-y-auto'>
          <Table
            hasCheckbox={true}
            checkboxCss="w-4 h-4"
            showRowBorder={false}
            tableHeader={tableHeader}
            tableRowArray={tableData}
          />
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default MultipleEntriesModal;
