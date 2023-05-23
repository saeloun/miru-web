import React, { useEffect, useState } from "react";

import { cashFormatter, currencySymbol, minToHHMM } from "helpers";
import Logger from "js-logger";
import { PlusIcon } from "miruIcons";
import { useParams, useNavigate } from "react-router-dom";

import clientApi from "apis/clients";
import AmountBoxContainer from "common/AmountBox";
import ChartBar from "common/ChartBar";
import EmptyStates from "common/EmptyStates";
import Table from "common/Table";
import ProjectForm from "components/Projects/List/Mobile/ProjectForm";
import AddEditProject from "components/Projects/Modals/AddEditProject";
import DeleteProject from "components/Projects/Modals/DeleteProject";
import { useUserContext } from "context/UserContext";
import { unmapClientDetails } from "mapper/mappedIndex";
import { sendGAPageView } from "utils/googleAnalytics";

import Header from "./Header";

import AddProject from "../Modals/AddProject";

const getTableData = (clients, isDesktop) => {
  if (clients && isDesktop) {
    return clients.map(client => ({
      col1: (
        <div className="text-base capitalize text-miru-dark-purple-1000">
          {client.name}
        </div>
      ),
      col2: (
        <div className="text-sm font-medium text-miru-dark-purple-1000">
          {client.team.map((member, index) => (
            <span key={index}>{member},&nbsp;</span>
          ))}
        </div>
      ),
      col3: (
        <div className="text-right text-lg font-bold text-miru-dark-purple-1000">
          {minToHHMM(client.minutes)}
        </div>
      ),
      rowId: client.id,
    }));
  } else if (clients && !isDesktop) {
    return clients.map(client => ({
      col1: (
        <div className="text-base font-medium capitalize text-miru-dark-purple-1000">
          {client.name}
          <br />
          <div className="w-57.5">
            {client.team.map((member, index) => (
              <span
                className="font-manrope text-xs text-miru-dark-purple-400"
                key={index}
              >
                {member},&nbsp;
              </span>
            ))}
          </div>
        </div>
      ),
      col2: (
        <div className="mr-4 text-right text-lg font-bold text-miru-dark-purple-1000">
          {minToHHMM(client.minutes)}
        </div>
      ),
      rowId: client.id,
    }));
  }

  return [{}];
};

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

  const tableHeader = [
    {
      Header: "PROJECT",
      accessor: "col1", // accessor is the "key" in the data
      cssClass: "md:w-1/3",
    },
    {
      Header: "TEAM",
      accessor: "col2",
      cssClass: "md:w-1/3",
    },
    {
      Header: "HOURS LOGGED",
      accessor: "col3",
      cssClass: "text-right  md:w-1/5", // accessor is the "key" in the data
    },
  ];

  const mobileTableHeader = [
    {
      Header: "PROJECT",
      accessor: "col1", // accessor is the "key" in the data
      cssClass: "md:w-1/3",
    },
    {
      Header: "HOURS",
      accessor: "col2",
      cssClass: "text-right md:w-1/5", // accessor is the "key" in the data
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

  const tableData = getTableData(projectDetails, isDesktop);

  const handleAddProject = () => {
    setShowProjectModal(true);
  };

  if (loading) {
    return (
      <p className="tracking-wide flex min-h-screen items-center justify-center text-base font-medium text-miru-han-purple-1000">
        Loading...
      </p>
    );
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

  return (
    <>
      <Header
        clientDetails={clientDetails}
        setShowProjectModal={setShowProjectModal}
      />
      <div>
        {isAdminUser && isDesktop && (
          <div className="bg-miru-gray-100 py-10 px-10">
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
                onChange={handleSelectChange}
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
            {projectDetails && (
              <ChartBar data={projectDetails} totalMinutes={totalMinutes} />
            )}
            <AmountBoxContainer amountBox={amountBox} />
          </div>
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
          setShowProjectModal={setShowProjectModal}
          showProjectModal={showProjectModal}
        />
      )}
    </>
  );
};

export default ClientDetails;
