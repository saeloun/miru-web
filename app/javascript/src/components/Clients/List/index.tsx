import React, { useEffect, useState, useRef } from "react";

import { cashFormatter, currencySymbol, minToHHMM } from "helpers";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { Avatar, Tooltip } from "StyledComponents";

import clientApi from "apis/clients";
import AmountBoxContainer from "common/AmountBox";
import ChartBar from "common/ChartBar";
import withLayout from "common/Mobile/HOC/withLayout";
import Table from "common/Table";
import { TOASTER_DURATION } from "constants/index";
import { useUserContext } from "context/UserContext";
import { unmapClientList } from "mapper/mappedIndex";
import { sendGAPageView } from "utils/googleAnalytics";

import Header from "./Header";

import DeleteClient from "../Modals/DeleteClient";
import EditClient from "../Modals/EditClient";
import NewClient from "../Modals/NewClient";

const getTableData = (clients, handleTooltip, showTooltip, toolTipRef) => {
  if (clients) {
    return clients.map(client => ({
      col1: (
        <Tooltip content={client.name} show={showTooltip}>
          <div className="flex">
            <Avatar classNameImg="mr-4" url={client.logo} />
            <span
              className="my-auto overflow-hidden truncate whitespace-nowrap text-base font-medium capitalize text-miru-dark-purple-1000"
              ref={toolTipRef}
              onMouseEnter={handleTooltip}
            >
              {client.name}
            </span>
          </div>
        </Tooltip>
      ),
      col2: (
        <div className="text-sm font-medium text-miru-dark-purple-1000">
          {client.email}
        </div>
      ),
      col3: (
        <div className="text-right text-xl font-bold text-miru-dark-purple-1000">
          {minToHHMM(client.minutes)}
        </div>
      ),
      rowId: client.id,
    }));
  }

  return [{}];
};

const Clients = ({ isAdminUser }) => {
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [client, setClient] = useState<boolean>(false);
  const [clientToEdit, setClientToEdit] = useState({});
  const [clientToDelete, setClientToDelete] = useState({});
  const [clientData, setClientData] = useState<any>();
  const [totalMinutes, setTotalMinutes] = useState(null);
  const [clientLogoUrl, setClientLogoUrl] = useState("");
  const [clientLogo, setClientLogo] = useState("");
  const [overdueOutstandingAmount, setOverdueOutstandingAmount] =
    useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [showToolTip, setShowToolTip] = useState<boolean>(false);

  const navigate = useNavigate();
  const toolTipRef = useRef(null);

  const handleEditClick = id => {
    setShowEditDialog(true);
    const editSelection = clientData.find(client => client.id === id);
    setClientToEdit(editSelection);
  };

  const handleDeleteClick = id => {
    setShowDeleteDialog(true);
    const editSelection = clientData.find(client => client.id === id);
    setClientToDelete(editSelection);
  };

  const fetchClientDetails = async val => {
    const res = await clientApi.get(`?time_frame=${val}`);
    const sanitized = unmapClientList(res);
    setClientData(sanitized.clientList);
    setTotalMinutes(sanitized.totalMinutes);
    setOverdueOutstandingAmount(sanitized.overdueOutstandingAmount);
    setLoading(false);
  };

  const handleRowClick = id => {
    navigate(`${id}`);
  };

  const handleTooltip = () => {
    if (toolTipRef?.current?.offsetWidth < toolTipRef?.current?.scrollWidth) {
      setShowToolTip(true);
    } else {
      setShowToolTip(false);
    }
  };

  useEffect(() => {
    sendGAPageView();
    fetchClientDetails("week");
  }, []);

  const tableHeader = [
    {
      Header: "CLIENT",
      accessor: "col1", // accessor is the "key" in the data
      cssClass: "md:w-1/3",
    },
    {
      Header: "EMAIL ID",
      accessor: "col2",
      cssClass: "md:w-1/3",
    },
    {
      Header: "HOURS LOGGED",
      accessor: "col3",
      cssClass: "text-right md:w-1/5", // accessor is the "key" in the data
    },
  ];

  const employeeTableHeader = [
    {
      Header: "CLIENT",
      accessor: "col1", // accessor is the "key" in the data
      cssClass: "",
    },
    {
      Header: "HOURS LOGGED",
      accessor: "col3",
      cssClass: "text-right", // accessor is the "key" in the data
    },
  ];

  const currencySymb = currencySymbol(overdueOutstandingAmount?.currency);

  const amountBox = [
    {
      title: "OVERDUE",
      amount:
        currencySymb + cashFormatter(overdueOutstandingAmount?.overdue_amount),
    },
    {
      title: "OUTSTANDING",
      amount:
        currencySymb +
        cashFormatter(overdueOutstandingAmount?.outstanding_amount),
    },
  ];

  const tableData = getTableData(
    clientData,
    handleTooltip,
    showToolTip,
    toolTipRef
  );

  if (loading) {
    return (
      <p className="tracking-wide flex min-h-screen items-center justify-center text-base font-medium text-miru-han-purple-1000">
        Loading...
      </p>
    );
  }

  return (
    <>
      <ToastContainer autoClose={TOASTER_DURATION} />
      <Header
        isAdminUser={isAdminUser}
        setShowDialog={setShowDialog}
        setnewClient={setClient}
      />
      <div>
        {isAdminUser && (
          <div
            className="bg-miru-gray-100 py-10 px-10"
            data-cy="clients-admin-data"
          >
            <div className="flex justify-end">
              <select
                className="focus:outline-none
                m-0
                border-none
                bg-transparent
                bg-clip-padding bg-no-repeat px-3
                py-1.5
                text-base
                font-normal
                text-miru-han-purple-1000
                transition
                ease-in-out"
                onChange={e => fetchClientDetails(e.target.value)}
              >
                <option className="text-miru-dark-purple-600" value="week">
                  THIS WEEK
                </option>
                <option className="text-miru-dark-purple-600" value="month">
                  THIS MONTH
                </option>
                <option className="text-miru-dark-purple-600" value="year">
                  THIS YEAR
                </option>
              </select>
            </div>
            {clientData && (
              <ChartBar data={clientData} totalMinutes={totalMinutes} />
            )}
            <AmountBoxContainer amountBox={amountBox} />
          </div>
        )}
        <div className="flex flex-col" data-cy="clients-list-table">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden">
                {clientData && (
                  <Table
                    handleDeleteClick={handleDeleteClick}
                    handleEditClick={handleEditClick}
                    hasRowIcons={isAdminUser}
                    rowOnClick={isAdminUser ? handleRowClick : () => {}} // eslint-disable-line  @typescript-eslint/no-empty-function
                    tableRowArray={tableData}
                    tableHeader={
                      isAdminUser ? tableHeader : employeeTableHeader
                    }
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {showEditDialog && (
        <EditClient
          client={clientToEdit}
          setShowEditDialog={setShowEditDialog}
        />
      )}
      {showDeleteDialog && (
        <DeleteClient
          client={clientToDelete}
          setShowDeleteDialog={setShowDeleteDialog}
        />
      )}
      {client && showDialog && (
        <NewClient
          clientData={clientData}
          clientLogo={clientLogo}
          clientLogoUrl={clientLogoUrl}
          setClientData={setClientData}
          setClientLogo={setClientLogo}
          setClientLogoUrl={setClientLogoUrl}
          setShowDialog={setShowDialog}
          setnewClient={setClient}
        />
      )}
    </>
  );
};

const ClientsLayout = () => {
  const { isDesktop } = useUserContext();
  const Main = withLayout(Clients, !isDesktop, !isDesktop);

  return <Main />;
};

export default ClientsLayout;
