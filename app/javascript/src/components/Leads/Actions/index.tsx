import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { setAuthHeaders } from "apis/axios";
import leads from "apis/leads";
import Pagination from "common/Pagination";

import Table from "common/Table";
import Header from "./Header";
import { TOASTER_DURATION } from "../../../constants/index";
import { unmapLeadTimelineList } from "../../../mapper/lead.timeline.mapper";

const getTableData = (timelines) => {
  if (timelines) {
    return timelines.map((item) =>
      ({
        col1: <div className="text-base text-miru-dark-purple-1000">{item.kind_name}</div>,
        col2: <div className="text-center text-miru-dark-purple-1000">{item.action_subject}</div>,
        col3: <div className="text-center text-miru-dark-purple-1000">{item.action_due_at_formated}</div>,
        col4: <div className="text-center text-miru-dark-purple-1000">{item.action_assignee.full_name}</div>,
        col5: <div className="text-center text-miru-dark-purple-1000">{item.action_reporter.full_name}</div>,
        col6: <div className="text-center text-miru-dark-purple-1000">{item.action_priority_code_name}</div>,
        rowId: item.id
      })
    );
  }
  return [{}];
};

const Actions = () => {
  const [timelineData, setTimelineData] = useState<any>();

  const [pagy, setPagy] = React.useState<any>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [params, setParams] = React.useState<any>({
    lead_actions_per_page: searchParams.get("lead_actions_per_page") || 10,
    page: searchParams.get("page") || 1
  });
  const queryParams = () => new URLSearchParams(params).toString();

  const fetchLeadActions = () => {
    leads.getActions(queryParams())
      .then((res) => {
        const sanitized = unmapLeadTimelineList(res);
        setTimelineData(sanitized.itemList);
        setPagy(res.data.pagy);
      });
  };

  useEffect(() => {
    fetchLeadActions();
    setSearchParams(params);
  }, [params.lead_actions_per_page, params.page]);

  useEffect(() => {
    setAuthHeaders();
    fetchLeadActions();
  }, []);

  const tableHeader = [
    {
      Header: "ACTION",
      accessor: "col1", // accessor is the "key" in the data
      cssClass: ""
    },{
      Header: "SUBJECT",
      accessor: "col2",
      cssClass: "text-center"
    },
    {
      Header: "DUE AT",
      accessor: "col3",
      cssClass: "text-center"
    },
    {
      Header: "ASSIGNEE",
      accessor: "col4",
      cssClass: "text-center"
    },
    {
      Header: "REPORTER",
      accessor: "col5",
      cssClass: "text-center"
    },
    {
      Header: "PRIORITY",
      accessor: "col6",
      cssClass: "text-center"
    }
  ];

  const tableData = getTableData(timelineData);

  return (
    <>
      <ToastContainer autoClose={TOASTER_DURATION} />
      <Header />
      <div>
        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="overflow-hidden">
                {timelineData && <Table
                  hasEditAction={false}
                  tableHeader={tableHeader}
                  tableRowArray={tableData}
                />}
                {timelineData && timelineData.length && (
                  <Pagination pagy={pagy} params={params} setParams={setParams} forPage="lead_actions" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Actions;
