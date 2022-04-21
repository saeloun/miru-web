import React, { useEffect, useState } from "react";
import Table from "common/MultipleLineItemTable";
import Footer from "./Footer";
import Header from "./Header";
import fetchNewLineItems from "../apiCalls/generateInvoice";

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
  },
  {
    Header: "",
    accessor: "id",
    cssClass: "hidden"
  }
];

const getTableData = (Entries) => {
  if (Entries) {
    return Entries.map((member) => ({
      col1: <div className='font medium text-sm text-miru-dark-purple-1000 text-left'>{member.first_name} {member.last_name}</div>,
      col2: <div className='font medium text-xs text-miru-dark-purple-600 text-left'>{member.description}</div>,
      col3: <div className='font medium text-xs text-miru-dark-purple-1000 text-right'>{member.date}</div>,
      col4: <div className='font medium text-xs text-miru-dark-purple-1000 text-right'>{member.qty}</div>,
      id: member.timesheet_entry_id
    }));
  }
};

const MultipleEntriesModal = ({
  setShowMultilineModal,
  selectedOption,
  setSelectedOption,
  selectedClient
}) => {

  const [lineItems, setLineItems] = useState<any>([]);
  const [totalLineItems, setTotalLineItems] = useState<Number>(null);
  const [showItemInputs, setShowItemInputs] = useState<boolean>(false);
  const [pageNumber, setPageNumber] = useState<number>(1);

  const [selectedRowsCount, setSelectedRowCount] = useState<any>(0);
  const [selectedLineItem, setSelectedLineItem] = useState<any>();
  const [resetTableRow, resetTableRowFn] = useState<boolean>(false);
  const [tableData, setTableData] = useState<any>([]);

  const getselectedRow =(rowsSelected) => {
    const selectedLineItemsList = rowsSelected.map(row => {
      const searchedLineItem =  lineItems.find(item => item.timesheet_entry_id === row.original.id);
      return { ...searchedLineItem, lineTotal: (Number(searchedLineItem.qty)/60 * Number(searchedLineItem.rate)) };
    });
    setSelectedLineItem(selectedLineItemsList);
    setSelectedRowCount(rowsSelected.length);
  };

  const handleAddEntriesClick = () => {
    setSelectedOption([...selectedOption, ...selectedLineItem]);
    setShowMultilineModal(false);
    setLineItems([]);
  };

  const tableDataSet = (lineItems) => {
    return
  }

  useEffect(() => {
    fetchNewLineItems(selectedClient, setLineItems, lineItems, setTotalLineItems, pageNumber, setPageNumber, tableDataSet,  selectedOption).then(async res => {
      setTotalLineItems(res.data.pagy.count);
      setPageNumber(pageNumber+1);
      setLineItems([...res.data.new_line_item_entries, ...lineItems]);
      setTableData([...getTableData(res.data.new_line_item_entries), ...getTableData(lineItems)])
    });
  }, []);


  const loadMoreItems = () => {
    fetchNewLineItems(selectedClient, setLineItems, lineItems, setTotalLineItems, pageNumber, setPageNumber, selectedOption).then(async res => {
      setTotalLineItems(res.data.pagy.count);
      setPageNumber(pageNumber+1);
      setLineItems([...res.data.new_line_item_entries, ...lineItems]);
      setTableData([...getTableData(res.data.new_line_item_entries), ...getTableData(lineItems)])
    });
  };

  console.log("tableData ----> ", tableData);

  return (
    <div style={{ background: "rgba(29, 26, 49,0.6)" }} className="px-52 py-20 w-full h-full fixed inset-0 flex justify-center z-50">
      <div className="bg-white rounded-lg w-full h-full flex flex-col justify-between">
        <Header
          setShowMultilineModal={setShowMultilineModal}
        />
        <div className='mx-6 h-full'>
          {
            tableData.length > 0 && <Table
              hasCheckbox={true}
              checkboxCss="w-4 h-4"
              RowCss="px-0 py-3"
              tableHeader={tableHeader}
              getselectedRow= {getselectedRow}
              loadMoreItems={loadMoreItems}
              lineItems={lineItems}
              pageNumber={pageNumber}
              tableData={tableData}
            />
          }
        </div>
        <Footer
          handleAddEntriesClick={handleAddEntriesClick}
          selectedRowCount={selectedRowsCount}
        />
      </div>
    </div>
  );
};

export default MultipleEntriesModal;
