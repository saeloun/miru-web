import React, { useEffect, useState } from "react";
import { useCookies } from 'react-cookie';
import { useNavigate, useSearchParams } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import leads from "apis/leads";
import Pagination from "common/Pagination";
import Table from "common/Table";
import FilterSideBar from "./FilterSideBar";

import Header from "./Header";
import { TOASTER_DURATION } from "../../../constants/index";
import { unmapLeadList } from "../../../mapper/lead.mapper";
import DeleteLead from "../Modals/DeleteLead";
import NewLead from "../Modals/NewLead";

const getTableData = (leads) => {
  if (leads) {
    return leads.map((lead) =>
      ({
        col1: lead.discarded_at ? <div className="text-xs text-red-600 tracking-widest">{lead.name}</div> : <div className="text-xs tracking-widest">{lead.name}</div>,
        col2: <div className="text-xs tracking-widest text-center">
          {lead.assignee_name ? lead.assignee_name : "UNASSIGNED"}
        </div>,
        col3: <div className="text-xs tracking-widest text-center">
          {lead.reporter_name ? lead.reporter_name : "UNREPORTED"}
        </div>,
        col4: <div className="text-xs tracking-widest text-center">
          {lead.quality_code_name}
        </div>,
        col5: <div className="text-xs tracking-widest text-center">
          {lead.status_code_name}
        </div>,
        rowId: lead.id
      })
    );
  }
  return [{}];
};

const Leads = ({ isAdminUser }) => {
  const [isFilterVisible, setFilterVisibilty] = React.useState<boolean>(false);

  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [newLead, setnewLead] = useState<boolean>(false);
  const [leadToDelete, setDelete] = useState({});
  const [leadData, setLeadData] = useState<any>([{}]);
  const [displayActions, setDisplayActions] = useState<boolean>(false);

  const [pagy, setPagy] = React.useState<any>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [params, setParams] = React.useState<any>({
    page: searchParams.get("page") || 1
  });
  const queryParams = () => new URLSearchParams(params).toString();

  const navigate = useNavigate();

  const [rememberFilter, setRememberFilter] = useCookies();

  const handleDeleteClick = (id) => {
    setShowDeleteDialog(true);
    const editSelection = leadData.find(lead => lead.id === id);
    setDelete(editSelection);
  };

  const handleRowClick = (id) => {
    navigate(`${id}`);
  };

  const fetchLeads = () => {
    if (rememberFilter.leadsFilter && Object.values(rememberFilter.leadsFilter).flat().length > 0){
      leads.get(new URLSearchParams(rememberFilter.leadsFilter).toString())
        .then((res) => {
          const sanitized = unmapLeadList(res);
          setLeadData(sanitized.leadList);
          setPagy(res.data.pagy);
          setFilterVisibilty(true);
        });
    } else {
      leads.get(queryParams())
        .then((res) => {
          const sanitized = unmapLeadList(res);
          setLeadData(sanitized.leadList);
          setPagy(res.data.pagy);
        });
    }
  };

  useEffect(() => {
    if (displayActions){
      navigate(`actions`);
    }
  }, [displayActions]);

  useEffect(() => {
    fetchLeads();
    setSearchParams(params);
  }, [params.page]);

  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
    fetchLeads();
  }, []);

  const tableHeader = [
    {
      Header: "LEAD",
      accessor: "col1", // accessor is the "key" in the data
      cssClass: ""
    },
    {
      Header: "Assignee",
      accessor: "col2",
      cssClass: "text-center"
    },
    {
      Header: "Reporter",
      accessor: "col3",
      cssClass: "text-center"
    },
    {
      Header: "Quality",
      accessor: "col4",
      cssClass: "text-center"
    },
    {
      Header: "Status",
      accessor: "col5",
      cssClass: "text-center"
    }
  ];

  const tableData = getTableData(leadData);

  return (
    <>
      <ToastContainer autoClose={TOASTER_DURATION} />
      <Header isAdminUser={isAdminUser} setnewLead={setnewLead} setFilterVisibilty={setFilterVisibilty} setDisplayActions={setDisplayActions} />
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
                {leadData && leadData.length && (
                  <Pagination pagy={pagy} params={params} setParams={setParams} forPage="leads" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {isFilterVisible && (
        <FilterSideBar setLeadData={setLeadData} setFilterVisibilty={setFilterVisibilty} rememberFilter={rememberFilter} setRememberFilter={setRememberFilter} />
      )}
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
