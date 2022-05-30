import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import leads from "apis/leads";

// import AmountBoxContainer from "common/AmountBox";
// import ChartBar from "common/ChartBar";
import Table from "common/Table";
// import { cashFormatter } from "helpers/cashFormater";
// import { currencySymbol } from "helpers/currencySymbol";

import Header from "./Header";
import { TOASTER_DURATION } from "../../../constants/index";
import { unmapLeadList } from "../../../mapper/lead.mapper";
import DeleteLead from "../Modals/DeleteLead";
import EditLead from "../Modals/EditLead";
import NewLead from "../Modals/NewLead";

const getTableData = (leads) => {
  if (leads) {
    return leads.map((lead) =>
      // const hours = (lead.minutes / 60).toFixed(2);
      ({
        col1: <div className="text-base text-miru-dark-purple-1000">{lead.name}</div>,
        col2: <div className="text-base text-miru-dark-purple-1000">{lead.budget_amount}</div>,
        col3: <div className="text-base text-miru-dark-purple-1000">{lead.budget_status_code}</div>,
        col4: <div className="text-base text-miru-dark-purple-1000">{lead.industry_code}</div>,
        col5: <div className="text-base text-miru-dark-purple-1000">{lead.quality_code}</div>,
        col6: <div className="text-base text-miru-dark-purple-1000">{lead.state_code}</div>,
        col7: <div className="text-base text-miru-dark-purple-1000">{lead.status_code}</div>,
        rowId: lead.id
      })
    );
  }
  return [{}];
};

const Leads = ({ isAdminUser }) => {
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [newLead, setnewLead] = useState<boolean>(false);
  const [leadToEdit, setedit] = useState({});
  const [leadToDelete, setDelete] = useState({});
  const [leadData, setLeadData] = useState<any>();
  const navigate = useNavigate();

  const handleEditClick = (id) => {
    setShowEditDialog(true);
    const editSelection = leadData.find(lead => lead.id === id);
    setedit(editSelection);
  };

  const handleDeleteClick = (id) => {
    setShowDeleteDialog(true);
    const editSelection = leadData.find(lead => lead.id === id);
    setDelete(editSelection);
  };

  // const handleSelectChange = (event) => {
  //   leads.get(`?time_frame=${event.target.value}`)
  //     .then((res) => {
  //       const sanitized = unmapLeadList(res);
  //       setLeadData(sanitized.leadList);
  //       // setTotalMinutes(sanitized.totalMinutes);
  //       // setOverDueOutstandingAmt(sanitized.overdueOutstandingAmount);
  //     });
  // };

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
        // setTotalMinutes(sanitized.totalMinutes);
        // setOverDueOutstandingAmt(sanitized.overdueOutstandingAmount);
      });
  }, []);

  const tableHeader = [
    {
      Header: "LEAD",
      accessor: "col1", // accessor is the "key" in the data
      cssClass: ""
    },
    {
      Header: "Budget Amount",
      accessor: "col2",
      cssClass: "text-right"
    },
    {
      Header: "Budget Status",
      accessor: "col3",
      cssClass: "text-right"
    },
    {
      Header: "Industry",
      accessor: "col4",
      cssClass: "text-right"
    },
    {
      Header: "Quality",
      accessor: "col5",
      cssClass: "text-right"
    },
    {
      Header: "State",
      accessor: "col6",
      cssClass: "text-right"
    },
    {
      Header: "Status",
      accessor: "col7",
      cssClass: "text-right"
    }
  ];

  // const currencySymb = currencySymbol(overdueOutstandingAmount?.currency);

  // const amountBox = [{
  //   title: "OVERDUE",
  //   amount: currencySymb + cashFormatter(overdueOutstandingAmount?.overdue_amount)
  // },
  // {
  //   title: "OUTSTANDING",
  //   amount: currencySymb + cashFormatter(overdueOutstandingAmount?.outstanding_amount)
  // }];

  const tableData = getTableData(leadData);

  return (
    <>
      <ToastContainer autoClose={TOASTER_DURATION} />
      <Header isAdminUser={isAdminUser} setnewLead={setnewLead} />
      <div>
        {/* {isAdminUser && <div className="bg-miru-gray-100 py-10 px-10">
          <div className="flex justify-end">
            <select onChange={handleSelectChange} className="px-3
                py-1.5
                text-base
                font-normal
                bg-transparent bg-clip-padding bg-no-repeat
                border-none
                transition
                ease-in-out
                m-0
                focus:outline-none
                text-miru-han-purple-1000">
              <option className="text-miru-dark-purple-600" value="week">
                THIS WEEK
              </option>
              <option className="text-miru-dark-purple-600" value="month">
                This MONTH
              </option>
              <option className="text-miru-dark-purple-600" value="year">
                THIS YEAR
              </option>
            </select>
          </div>
          {leadData && <ChartBar data={leadData} totalMinutes={totalMinutes} />}
          <AmountBoxContainer amountBox={amountBox} />
        </div>
        } */}
        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="overflow-hidden">
                {leadData && <Table
                  handleEditClick={handleEditClick}
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
      {showEditDialog &&
        <EditLead
          setShowEditDialog={setShowEditDialog}
          lead={leadToEdit}
        />
      }
      {showDeleteDialog && (
        <DeleteLead
          setShowDeleteDialog={setShowDeleteDialog}
          lead={leadToDelete}
        />
      )}
      {newLead && (
        <NewLead
          setnewLead={setnewLead}
          setLeadData={setLeadData}
          leadData={leadData}
        />
      )}
    </>

  );
};

export default Leads;
