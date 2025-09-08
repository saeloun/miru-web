import React, { useEffect, useState, useRef } from "react";

import { clientApi } from "apis/api";
import Loader from "common/Loader/index";
import withLayout from "common/Mobile/HOC/withLayout";
import { useUserContext } from "context/UserContext";
import { unmapClientList } from "mapper/mappedIndex";
import { useNavigate } from "react-router-dom";
import { sendGAPageView } from "utils/googleAnalytics";

import ClientMobileMoreOptions from "./ClientMobileMoreOptions";
import Header from "./Header";
import ClientList from "./List";
import DeleteClient from "./Modals/DeleteClient";
import EditClient from "./Modals/EditClient";
import NewClient from "./Modals/NewClient";
import TotalHoursChart from "./TotalHoursChart";

const Clients = ({ isAdminUser }) => {
  const [clientId, setClientId] = useState("");
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [showMoreOptions, setShowMoreOptions] = useState<boolean>(false);
  const [isClient, setIsClient] = useState<boolean>(false);
  const [clientToEdit, setClientToEdit] = useState({});
  const [clientToDelete, setClientToDelete] = useState({});
  const [clientData, setClientData] = useState<any>();
  const [totalMinutes, setTotalMinutes] = useState(null);
  const [clientLogoUrl, setClientLogoUrl] = useState("");
  const [clientLogo, setClientLogo] = useState("");
  const [overdueOutstandingAmount, setOverdueOutstandingAmount] =
    useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [showToolTip, setShowToolTip] = useState<boolean>(false);
  const { isDesktop } = useUserContext();
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

  const fetchClientDetails = async (val = "week") => {
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
    fetchClientDetails();

    const close = e => {
      if (e.keyCode === 27) {
        setIsClient(false);
      }
    };
    window.addEventListener("keydown", close);
  }, []);

  if (loading) {
    return <Loader />;
  }

  const ClientsLayout = () => (
    <>
      {clientData.length > 0 && (
        <Header
          isAdminUser={isAdminUser}
          setShowDialog={setShowDialog}
          setnewClient={setIsClient}
        />
      )}
      <div>
        <TotalHoursChart
          clientData={clientData}
          fetchClientDetails={fetchClientDetails}
          overdueOutstandingAmount={overdueOutstandingAmount}
          totalMinutes={totalMinutes}
        />
        <ClientList
          clientData={clientData}
          handleDeleteClick={handleDeleteClick}
          handleEditClick={handleEditClick}
          handleRowClick={handleRowClick}
          handleTooltip={handleTooltip}
          setClientId={setClientId}
          setIsClient={setIsClient}
          setShowDialog={setShowDialog}
          setShowMoreOptions={setShowMoreOptions}
          showToolTip={showToolTip}
          toolTipRef={toolTipRef}
        />
      </div>
      {showEditDialog && (
        <EditClient
          client={clientToEdit}
          fetchDetails={fetchClientDetails}
          setShowEditDialog={setShowEditDialog}
          showEditDialog={showEditDialog}
        />
      )}
      {showDeleteDialog && (
        <DeleteClient
          client={clientToDelete}
          setShowDeleteDialog={setShowDeleteDialog}
          showDeleteDialog={showDeleteDialog}
        />
      )}
      {isClient && showDialog && (
        <NewClient
          clientData={clientData}
          clientLogo={clientLogo}
          clientLogoUrl={clientLogoUrl}
          setClientData={setClientData}
          setClientLogo={setClientLogo}
          setClientLogoUrl={setClientLogoUrl}
          setShowDialog={setShowDialog}
          setnewClient={setIsClient}
          showDialog={showDialog}
        />
      )}
      {showMoreOptions && (
        <ClientMobileMoreOptions
          clientId={clientId}
          handleDeleteClick={handleDeleteClick}
          handleEditClick={handleEditClick}
          setShowMoreOptions={setShowMoreOptions}
          showMoreOptions={showMoreOptions}
        />
      )}
    </>
  );
  const Main = withLayout(ClientsLayout, !isDesktop, !isDesktop);

  return isDesktop ? ClientsLayout() : <Main />;
};

export default Clients;
