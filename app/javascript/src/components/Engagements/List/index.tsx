import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import ReactTooltip from "react-tooltip";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import engagements from "apis/engagements";
import Pagination from "common/Pagination";
import Table from "common/Table";
import { CircleWavyWarning } from "phosphor-react";
import Tab from "./../Tab";
import FilterSideBar from "./FilterSideBar";
import Header from "./Header";

import { TOASTER_DURATION } from "../../../constants/index";
import { unmapEngagementList, unmapEngagementDetails } from "../../../mapper/engagement.mapper";

const ENGAGEMENT_OPTIONS = [
  { id: "1", name: "Free" },
  { id: "2", name: "Partially" },
  { id: "3", name: "Fully" },
  { id: "4", name: "Over" }
];

const Engagements = ({ isAdminUser }) => {
  const [isFilterVisible, setFilterVisibilty] = React.useState<boolean>(false);
  const [engagementData, setEngagementData] = useState<any>([{}]);
  const [pagy, setPagy] = React.useState<any>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [params, setParams] = React.useState<any>({
    page: searchParams.get("page") || 1,
    ...(searchParams.has("q[first_name_or_last_name_or_email_cont]") && { ["q[first_name_or_last_name_or_email_cont]"]: searchParams.get("q[first_name_or_last_name_or_email_cont]") }),
    ...(searchParams.has("engagements") && { engagements: searchParams.getAll("engagements") }),
    ...(searchParams.has("departments") && { departments: searchParams.getAll("departments") })
  });
  const queryParams = () => new URLSearchParams(params).toString();

  const fetchEngagements = () => {
    engagements.get(queryParams())
      .then((res) => {
        const sanitized = unmapEngagementList(res);
        setEngagementData(sanitized.list);
        setPagy(res.data.pagy);
      });
  };

  useEffect(() => {
    fetchEngagements();
    setSearchParams(params);
  }, [params])

  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
  }, []);

  const tableHeader = [
    {
      Header: "Employee",
      accessor: "col1", // accessor is the "key" in the data
      cssClass: ""
    },
    {
      Header: "Email",
      accessor: "col2", // accessor is the "key" in the data
      cssClass: ""
    },
    {
      Header: "Department",
      accessor: "col3",
      cssClass: "text-center"
    },
    {
      Header: "Engagement",
      accessor: "col4",
      cssClass: "text-left"
    },
  ];

  const updateEngagement = (userId, e: React.MouseEvent<HTMLElement>) => {
    const userCurrentEngageCode = engagementData.find((i) => i.id === userId).engage_code
    if ( userCurrentEngageCode && (e.target as any).value === userCurrentEngageCode.toString() ) return

    engagements.update(userId, {
      engagement: {
        engage_code: (e.target as any).value,
      }
    }).then((res) => {
      setEngagementData(engagementData.map((element, _index) => {
        const updatedElement = unmapEngagementDetails(res.data.user)
        return (element.id === updatedElement.id ? updatedElement : element)
      }));
    });
  }

  const getTableData = (users) => {
    if (!users) return [{}];
    return users.map((user) =>
      ({
        col1: user.discarded_at ? <div className="text-xs tracking-widest text-red-600">{user.name}</div> : <div className="text-xs tracking-widest">{user.name}</div>,
        col2: user.discarded_at ? <div className="text-xs tracking-widest text-red-600">{user.email}</div> : <div className="text-xs tracking-widest">{user.email}</div>,
        col3: <div className="text-xs tracking-widest text-center">
          {user.department_name}
        </div>,
        col4: <div className="text-xs tracking-widest text-left">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            {ENGAGEMENT_OPTIONS.map((option, index) => {
              let borderClass = {}
              borderClass[0] = "rounded-l-lg border",
              borderClass[(ENGAGEMENT_OPTIONS.length - 1)] = "rounded-r-md border"
              borderClass = borderClass[index] || "border-t border-b border-l"
              const hoverClass = {
                free: "hover:bg-miru-alert-pink-400 hover:text-miru-alert-red-1000",
                partially: "hover:bg-miru-alert-yellow-400",
                fully: "hover:bg-miru-alert-green-200 hover:text-miru-alert-green-800",
                over: "hover:bg-miru-alert-green-800 hover:text-miru-alert-green-400",
              }[option.name.toLowerCase()]
              let activeClass = {
                free: "bg-miru-alert-pink-400 text-miru-alert-red-1000",
                partially: "bg-miru-alert-yellow-400",
                fully: "bg-miru-alert-green-200 text-miru-alert-green-800",
                over: "bg-miru-alert-green-800 text-miru-alert-green-400",
              }[option.name.toLowerCase()]
              activeClass = option.name.toLowerCase() === (user.engage_name || "").toLowerCase() ? activeClass : ""
              return (<button type="button"
                key={`engagement-option-${index}`}
                value={option.id}
                className={`py-1 px-2 text-sm font-medium text-gray-900 bg-white ${borderClass} border-gray-200 ${activeClass} ${hoverClass} focus:z-10 focus:ring-2`}
                onClick={(e) => updateEngagement(user.id, e)}>
                {option.name}
              </button>)
            })}
            {user.engage_updated_by_name && <div className="px-2 py-1 text-sm font-medium">
              <ReactTooltip id={`userTip-${user.id}`} effect="solid" backgroundColor="grey" textColor="white" place="top">
                <p className="text-xs">
                  Updated by <b>{user.engage_updated_by_name}</b> at <b>{user.engage_updated_at}</b>
                </p>
              </ReactTooltip>
              <CircleWavyWarning size={20} data-tip data-for={`userTip-${user.id}`} />
            </div> }
          </div>
        </div>,
        rowId: user.id
      })
    );
  };

  return (
    <>
      <ToastContainer autoClose={TOASTER_DURATION} />
      <Tab isAdminUser={isAdminUser} tabClassName={'list'}/>
      <Header
        setFilterVisibilty={setFilterVisibilty}
        setEngagementData={setEngagementData}
        setPagy={setPagy}
        params={params}
        setParams={setParams}
      />
      <div>
        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden">
                {engagementData && <Table
                  hasRowIcons={isAdminUser}
                  tableHeader={tableHeader}
                  tableRowArray={getTableData(engagementData)}
                  hasDeleteAction={false}
                  hasEditAction={false}
                />}
                {engagementData && engagementData.length && (
                  <Pagination pagy={pagy} params={params} setParams={setParams} forPage="engagements" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {isFilterVisible && (
        <FilterSideBar setEngagementData={setEngagementData} setFilterVisibilty={setFilterVisibilty} rememberFilter={params} setRememberFilter={setParams} setPagy={setPagy} />
      )}
    </>
  );
};

export default Engagements;
