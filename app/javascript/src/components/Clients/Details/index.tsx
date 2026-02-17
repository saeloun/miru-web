import React, { useEffect, useState } from "react";

import { clientApi } from "apis/api";
import EmptyStates from "common/EmptyStates";
import Loader from "common/Loader/index";
import Table from "common/Table";
import ProjectForm from "components/Projects/List/Mobile/ProjectForm";
import AddEditProject from "components/Projects/Modals/AddEditProject";
import DeleteProject from "components/Projects/Modals/DeleteProject";
import { useUserContext } from "context/UserContext";
import Logger from "js-logger";
import { unmapClientInvoices } from "mapper/client.mapper";
import { unmapClientDetails } from "mapper/mappedIndex";
import { PlusIcon } from "miruIcons";
import { useParams, useNavigate } from "react-router-dom";
import { sendGAPageView } from "utils/googleAnalytics";

import { tableHeader, mobileTableHeader } from "./constants";
import Header from "./Header";
import TableData from "./TableData";
import TotalHoursChart from "./TotalHoursChart";

import AddProject from "../Modals/AddProject";
import PaymentReminder from "../Modals/PaymentReminder";
import MobilePaymentReminder from "../Modals/PaymentReminder/MobileView";

const ClientDetails = ({ isAdminUser }) => {
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [selectedProject, setSelectedProject] = useState({});
  const [projectDetails, setProjectDetails] = useState<any>();
  const [totalMinutes, setTotalMinutes] = useState(null);
  const [clientDetails, setClientDetails] = useState<any>({});
  const [editProjectData, setEditProjectData] = useState<any>({});
  const [showProjectModal, setShowProjectModal] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [overdueOutstandingAmount, setOverdueOutstandingAmount] =
    useState<any>(null);
  const [clientInvoices, setClientInvoices] = useState<any[]>([]);
  const [sendPaymentReminder, setSendPaymentReminder] =
    useState<boolean>(false);

  const params = useParams();
  const navigate = useNavigate();
  const { isDesktop } = useUserContext();

  const handleEditClick = id => {
    setShowEditDialog(true);
    const editSelection = projectDetails.find(project => project.id === id);
    setEditProjectData(editSelection);
    setSelectedProject(editSelection);
  };

  const handleDeleteClick = id => {
    setShowDeleteDialog(true);
    const editSelection = projectDetails.find(project => project.id === id);
    setSelectedProject(editSelection);
  };

  const handleSelectChange = async event => {
    const res = await clientApi.show(
      params.clientId,
      `?time_frame=${event.target.value}`
    );
    const sanitized = unmapClientDetails(res);
    setProjectDetails(sanitized.projectDetails);
    setClientDetails(sanitized.clientDetails);
    setTotalMinutes(sanitized.totalMinutes);
    setOverdueOutstandingAmount(sanitized.overdueOutstandingAmount);
    setLoading(false);
  };

  const fetchProjectList = async () => {
    try {
      const res = await clientApi.show(params.clientId, "?time_frame=week");
      const sanitized = unmapClientDetails(res);
      setClientDetails(sanitized.clientDetails);
      setProjectDetails(sanitized.projectDetails);
      setTotalMinutes(sanitized.totalMinutes);
      setOverdueOutstandingAmount(sanitized.overdueOutstandingAmount);
      setClientInvoices(unmapClientInvoices(res));
      setLoading(false);
    } catch (e) {
      Logger.error(e);
      navigate("/clients");
    }
  };

  useEffect(() => {
    sendGAPageView();
    fetchProjectList();
  }, []);

  const tableData = TableData(projectDetails, isDesktop);

  const handleRowClick = id => {
    navigate(`/projects/${id}`);
  };

  const handleAddProject = () => {
    setShowProjectModal(true);
  };

  if (loading) {
    return <Loader />;
  }

  if (!isDesktop && showProjectModal) {
    return (
      <ProjectForm
        editProjectData={editProjectData}
        fetchProjects={fetchProjectList}
        setEditProjectData={setEditProjectData}
        setShowProjectModal={setShowProjectModal}
      />
    );
  }

  if (!isDesktop && sendPaymentReminder) {
    return (
      <MobilePaymentReminder
        client={clientDetails}
        clientInvoices={clientInvoices}
        isDesktop={isDesktop}
        setSendPaymentReminder={setSendPaymentReminder}
      />
    );
  }

  return (
    <>
      <Header
        clientDetails={clientDetails}
        fetchDetails={fetchProjectList}
        setSendPaymentReminder={setSendPaymentReminder}
        setShowProjectModal={setShowProjectModal}
      />
      <div>
        {isAdminUser && isDesktop && (
          <TotalHoursChart
            handleSelectChange={handleSelectChange}
            overdueOutstandingAmount={overdueOutstandingAmount}
            projectDetails={projectDetails}
            totalMinutes={totalMinutes}
          />
        )}
        <div className="flex flex-col">
          <div className="overflow-XIcon-auto -my-2 sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden">
                {projectDetails && projectDetails.length > 0 ? (
                  <Table
                    hasRowIcons
                    handleDeleteClick={handleDeleteClick}
                    handleEditClick={handleEditClick}
                    rowOnClick={isAdminUser ? handleRowClick : () => {}}
                    tableHeader={isDesktop ? tableHeader : mobileTableHeader}
                    tableRowArray={tableData}
                  />
                ) : (
                  <EmptyStates
                    Message="No project has been added to this client yet."
                    messageClassName="w-full lg:mt-5"
                    showNoSearchResultState={false}
                    wrapperClassName="mt-5"
                  >
                    <button
                      className="mt-4 mb-10 flex h-10 flex-row items-center justify-center rounded bg-miru-han-purple-1000 px-25 font-bold text-white"
                      type="button"
                      onClick={handleAddProject}
                    >
                      <PlusIcon size={20} weight="bold" />
                      <span className="ml-2 inline-block text-xl">
                        Add Project
                      </span>
                    </button>
                  </EmptyStates>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {showEditDialog && (
        <AddEditProject
          editProjectData={editProjectData}
          fetchProjectList={fetchProjectList}
          projectData={selectedProject}
          setEditProjectData={setEditProjectData}
          setShowProjectModal={setShowEditDialog}
          showProjectModal={showEditDialog}
        />
      )}
      {showDeleteDialog && (
        <DeleteProject
          fetchProjectList={fetchProjectList}
          project={selectedProject}
          setShowDeleteDialog={setShowDeleteDialog}
          showDeleteDialog={showDeleteDialog}
        />
      )}
      {showProjectModal && (
        <AddProject
          clientDetails={clientDetails}
          fetchProjectList={fetchProjectList}
          setShowProjectModal={setShowProjectModal}
          showProjectModal={showProjectModal}
        />
      )}
      {isDesktop && sendPaymentReminder && (
        <PaymentReminder
          client={clientDetails}
          clientInvoices={clientInvoices}
          isDesktop={isDesktop}
          sendPaymentReminder={sendPaymentReminder}
          setSendPaymentReminder={setSendPaymentReminder}
        />
      )}
    </>
  );
};

export default ClientDetails;
