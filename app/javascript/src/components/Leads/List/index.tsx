import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import leads from "apis/leads";

import Table from "common/Table";

import Header from "./Header";
import { TOASTER_DURATION } from "../../../constants/index";
import { unmapLeadList } from "../../../mapper/lead.mapper";
import DeleteLead from "../Modals/DeleteLead";
import NewLead from "../Modals/NewLead";

const getTableData = (leads) => {
  if (leads) {
    return leads.map((lead) =>
      ({
        col1: <div className="text-base text-miru-dark-purple-1000">{lead.name}</div>,
        col2: <div className="text-base text-miru-dark-purple-1000 text-center">{lead.budget_amount}</div>,
        col3: <div className="text-base text-miru-dark-purple-1000 text-center">{lead.budget_status_code_name}</div>,
        col4: <div className="text-base text-miru-dark-purple-1000 text-center">{lead.industry_code_name}</div>,
        col5: <div className="text-base text-miru-dark-purple-1000 text-center">{lead.quality_code_name}</div>,
        col6: <div className="text-base text-miru-dark-purple-1000 text-center">{lead.state_code_name}</div>,
        col7: <div className="text-base text-miru-dark-purple-1000 text-center">{lead.status_code_name}</div>,
        rowId: lead.id
      })
    );
  }
  return [{}];
};

const Leads = ({ isAdminUser }) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [newLead, setnewLead] = useState<boolean>(false);
  const [leadToDelete, setDelete] = useState({});
  const [leadData, setLeadData] = useState<any>();
  const navigate = useNavigate();

  const handleDeleteClick = (id) => {
    setShowDeleteDialog(true);
    const editSelection = leadData.find(lead => lead.id === id);
    setDelete(editSelection);
  };

  const handleRowClick = (id) => {
    navigate(`${id}`);
  };

  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
    leads.get("")
      .then((res) => {
        const sanitized = unmapLeadList(res);
        setLeadData(sanitized.leadList);
      });
  }, []);

  const tableHeader = [
    {
      Header: "LEAD",
      accessor: "col1", // accessor is the "key" in the data
      cssClass: ""
    },
    {
      Header: "Quality",
      accessor: "col5",
      cssClass: "text-center"
    },
    {
      Header: "Status",
      accessor: "col7",
      cssClass: "text-center"
    }
  ];

  const tableData = getTableData(leadData);

  return (
    <>
      <ToastContainer autoClose={TOASTER_DURATION} />
      <Header isAdminUser={isAdminUser} setnewLead={setnewLead} />
      <div>
        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="overflow-hidden">
                {leadData && <Table
                  hasEditAction={false}
                  handleDeleteClick={handleDeleteClick}
                  hasRowIcons={isAdminUser}
                  tableHeader={tableHeader}
                  tableRowArray={tableData}
                  rowOnClick={isAdminUser ? handleRowClick : () => { }}// eslint-disable-line
                />}
              </div>
            </div>
          </div>
        </div>
      </div>
      {showDeleteDialog && (
        <DeleteLead
          setShowDeleteDialog={setShowDeleteDialog}
          lead={leadToDelete}
        />
      )}
      {newLead && (
        <NewLead
          setnewLead={setnewLead}
        />
      )}
    </>

  );
};

export default Leads;
