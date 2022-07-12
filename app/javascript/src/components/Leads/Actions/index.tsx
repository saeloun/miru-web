import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { setAuthHeaders } from "apis/axios";
import leadAllowedUsersApi from "apis/lead-allowed-users";
import leadTimelineItemsApi from "apis/lead-timeline-items";
import leadTimelines from "apis/lead-timelines";
import leads from "apis/leads";
import Pagination from "common/Pagination";

import Table from "common/Table";
import Toastr from "common/Toastr";
import Header from "./Header";
import { TOASTER_DURATION } from "../../../constants/index";
import { unmapLeadTimelineList, unmapLeadTimelineDetails } from "../../../mapper/lead.timeline.mapper";

const Actions = () => {
  const navigate = useNavigate();

  const [tableData, setTableData] = useState<any>(null);
  const [timelineData, setTimelineData] = useState<any>(null);
  const [allowUserList, setAllowUserLIst] = useState<any>(null);
  const [priorityCodeList, setPriorityCodeList] = useState<any>(null);

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

  const getAllowedUsers = async () => {
    leadAllowedUsersApi.get()
      .then((data) => {
        setAllowUserLIst(data.data.allowed_user_list);
      }).catch(() => {
        setAllowUserLIst({});
      });
  };

  const getLeadTimelineItems = async () => {
    leadTimelineItemsApi.get()
      .then((data) => {
        setPriorityCodeList(data.data.priority_codes);
      }).catch(() => {
        setPriorityCodeList({});
      });
  };

  const changeAssignee = async (parentLeadId, objId, selectedAssigneeId) => {
    await leadTimelines.update(parentLeadId, objId, {
      "action_assignee_id": selectedAssigneeId,
    }).then(res => {
      const sanitizedTimelineData = timelineData.filter(option =>
        option.id !== unmapLeadTimelineDetails(res).timelineDetails.id
      );
      setTimelineData([...sanitizedTimelineData, unmapLeadTimelineDetails(res).timelineDetails].sort((a, b) =>
        a.action_due_at > b.action_due_at ? 1 : -1,
      ));
      navigate(`/leads/actions?${queryParams()}`)
      Toastr.success("Action updated successfully");
    }).catch((e) => {
      Toastr.error(e.message);
    });
  };

  const changePriorityCode = async (parentLeadId, objId, selectedPriorityCode) => {
    await leadTimelines.update(parentLeadId, objId, {
      "action_priority_code": selectedPriorityCode,
    }).then(res => {
      const sanitizedTimelineData = timelineData.filter(option =>
        option.id !== unmapLeadTimelineDetails(res).timelineDetails.id
      );
      setTimelineData([...sanitizedTimelineData, unmapLeadTimelineDetails(res).timelineDetails].sort((a, b) =>
        a.action_due_at > b.action_due_at ? 1 : -1,
      ));
      navigate(`/leads/actions?${queryParams()}`)
      Toastr.success("Action updated successfully");
    }).catch((e) => {
      Toastr.error(e.message);
    });
  };

  const getTableData = (timelines) => {
    if (timelines) {
      return timelines.map((item, index) =>
        ({
          col1: <div className="text-base text-miru-dark-purple-1000">{item.kind_name}</div>,
          col2: <div className="text-center text-miru-dark-purple-1000">
            {item.lead && <Link
              key={index}
              className="text-blue-700 no-underline hover:underline"
              to={`/leads/${item.lead.id}/timelines`} >
              {item.lead.name}
            </Link>}
          </div>,
          col3: <div className="text-center text-miru-dark-purple-1000">{item.action_subject}</div>,
          col4: <div className="text-center text-miru-dark-purple-1000">{item.action_due_at_formated}</div>,
          col5: <div className="text-center text-miru-dark-purple-1000">
            {item.lead && <select
              key={index}
              defaultValue={item.action_assignee.id}
              className="w-full border border-gray-300 dark:border-gray-700 py-1 shadow-sm rounded text-xs focus:outline-none focus:border-blue-700 bg-transparent placeholder-gray-500 text-gray-600 dark:text-gray-400"
              onChange={(e) => changeAssignee(item.lead.id, item.id, e.target.value)}>
              <option value=''>Select Assignee</option>
              {allowUserList &&
                allowUserList.map(e => <option value={e.id} key={e.id} selected={e.id === item.action_assignee.id} >{e.first_name}{' '}{e.last_name}</option>)}
            </select>}
          </div>,
          col6: <div className="text-center text-miru-dark-purple-1000">{item.action_reporter ? item.action_reporter.full_name : ''}</div>,
          col7: <div className="text-center text-miru-dark-purple-1000">
            {item.lead && <select
              key={index}
              defaultValue={item.action_priority_code}
              className="w-full border border-gray-300 dark:border-gray-700 py-1 shadow-sm rounded text-xs focus:outline-none focus:border-blue-700 bg-transparent placeholder-gray-500 text-gray-600 dark:text-gray-400"
              onChange={(e) => changePriorityCode(item.lead.id, item.id, e.target.value)} >
              <option value=''>Select Priority</option>
              {priorityCodeList &&
                priorityCodeList.map(e => <option value={e.id} key={e.id} selected={e.id === item.action_priority_code} >{e.name}</option>)}
            </select>}
          </div>,
          rowId: item.id
        })
      );
    }
    return [{}];
  };

  useEffect(() => {
    fetchLeadActions();
    getAllowedUsers();
    getLeadTimelineItems();
    setSearchParams(params);
  }, [params.lead_actions_per_page, params.page]);

  useEffect(() => {
    setAuthHeaders();
    fetchLeadActions();
    getAllowedUsers();
    getLeadTimelineItems();
  }, []);

  useEffect(() => {
    setTableData(getTableData(timelineData))
  }, [timelineData]);

  const tableHeader = [
    {
      Header: "ACTION",
      accessor: "col1", // accessor is the "key" in the data
      cssClass: ""
    },{
      Header: "LEAD",
      accessor: "col2",
      cssClass: "text-center"
    },{
      Header: "SUBJECT",
      accessor: "col3",
      cssClass: "text-center"
    },
    {
      Header: "DUE AT",
      accessor: "col4",
      cssClass: "text-center"
    },
    {
      Header: "ASSIGNEE",
      accessor: "col5",
      cssClass: "text-center"
    },
    {
      Header: "REPORTER",
      accessor: "col6",
      cssClass: "text-center"
    },
    {
      Header: "PRIORITY",
      accessor: "col7",
      cssClass: "text-center"
    }
  ];

  return (
    <>
      <ToastContainer autoClose={TOASTER_DURATION} />
      <Header />
      <div>
        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="overflow-hidden">
                {timelineData && tableData && <Table
                  hasEditAction={false}
                  tableHeader={tableHeader}
                  tableRowArray={tableData}
                />}
                {timelineData && tableData && timelineData.length && (
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
