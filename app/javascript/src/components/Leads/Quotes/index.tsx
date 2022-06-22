import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { setAuthHeaders } from "apis/axios";
import leadQuotes from "apis/lead-quotes";

import Table from "common/Table";

import DeleteQuote from "./../Modals/DeleteQuote";
import EditQuote from "./../Modals/EditQuote";
import NewQuote from "./../Modals/NewQuote";
import Header from "./Header";
import { TOASTER_DURATION } from "../../../constants/index";
import { unmapLeadQuoteList } from "../../../mapper/lead.quote.mapper";
import getStatusCssClass from "../../../utils/getStatusTag";

const getTableData = (quotes) => {
  if (quotes) {
    return quotes.map((item) =>
      ({
        col1: <div className="text-base text-miru-dark-purple-1000">{item.name}</div>,
        col2: <div className="text-center text-miru-dark-purple-1000">{item.description}</div>,
        col3: <div className="text-center text-miru-dark-purple-1000">
          <span className={item.status ? `${getStatusCssClass(item.status)} uppercase` : ""}>
            {item.status ? item.status.replaceAll('_',' ') : ""}
          </span>
        </div>,
        rowId: item.id
      })
    );
  }
  return [{}];
};

const Quotes = ({ leadDetails }) => {
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [newLead, setnewLead] = useState<boolean>(false);
  const [leadToEdit, setEdit] = useState({});
  const [leadToDelete, setDelete] = useState({});
  const [leadData, setLeadData] = useState<any>();
  const navigate = useNavigate();

  const handleEditClick = (id) => {
    setShowEditDialog(true);
    const editSelection = leadData.find(i => i.id === id);
    setEdit(editSelection);
  };

  const handleDeleteClick = (id) => {
    setShowDeleteDialog(true);
    const editSelection = leadData.find(i => i.id === id);
    setDelete(editSelection);
  };

  useEffect(() => {
    setAuthHeaders();
    if (leadDetails && leadDetails.id) {
      leadQuotes.index(leadDetails.id, "")
        .then((res) => {
          const sanitized = unmapLeadQuoteList(res);
          setLeadData(sanitized.itemList);
        });
    }
  }, [leadDetails.id]);

  const tableHeader = [
    {
      Header: "QUOTE",
      accessor: "col1", // accessor is the "key" in the data
      cssClass: ""
    },
    {
      Header: "DESCRIPTION",
      accessor: "col2",
      cssClass: "text-center"
    },
    {
      Header: "STATUS",
      accessor: "col3",
      cssClass: "text-center"
    }
  ];

  const tableData = getTableData(leadData);

  const handleRowClick = (id) => {
    navigate(`${id}`);
  };

  return (
    <>
      <ToastContainer autoClose={TOASTER_DURATION} />
      <Header isAdminUser={true} setnewLead={setnewLead} />
      <div>
        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="overflow-hidden">
                {leadData && <Table
                  handleEditClick={handleEditClick}
                  handleDeleteClick={handleDeleteClick}
                  hasRowIcons={true}
                  tableHeader={tableHeader}
                  tableRowArray={tableData}
                  rowOnClick={handleRowClick}
                />}
              </div>
            </div>
          </div>
        </div>
      </div>
      {showEditDialog &&
        <EditQuote
          leadDetails={leadDetails}
          item={leadToEdit}
          setShowEditDialog={setShowEditDialog}
        />
      }
      {showDeleteDialog && (
        <DeleteQuote
          leadDetails={leadDetails}
          item={leadToDelete}
          setShowDeleteDialog={setShowDeleteDialog}
        />
      )}
      {newLead && (
        <NewQuote
          leadDetails={leadDetails}
          leadData={leadData}
          setnewLead={setnewLead}
          setLeadData={setLeadData}
        />
      )}
    </>
  );
};

export default Quotes;
