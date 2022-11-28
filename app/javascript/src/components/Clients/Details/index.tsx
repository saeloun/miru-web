import React, { useEffect, useState } from "react";

import { cashFormatter, currencySymbol, minToHHMM } from "helpers";
import Logger from "js-logger";
import { useParams, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import { setAuthHeaders, registerIntercepts } from "apis/axios";
import clientApi from "apis/clients";
import AmountBoxContainer from "common/AmountBox";
import ChartBar from "common/ChartBar";
import Table from "common/Table";
import AddEditProject from "components/Projects/Modals/AddEditProject";
import DeleteProject from "components/Projects/Modals/DeleteProject";
import { TOASTER_DURATION } from "constants/index";
import { sendGAPageView } from "utils/googleAnalytics";

import Header from "./Header";

import { unmapClientDetails } from "../../../mapper/client.mapper";

const getTableData = clients => {
  if (clients) {
    return clients.map(client => ({
      col1: (
        <div className="text-base text-miru-dark-purple-1000">
          {client.name}
        </div>
      ),
      col2: (
        <div className="text-base text-miru-dark-purple-1000">
          {client.team.map((member, index) => (
            <span key={index}>{member},&nbsp;</span>
          ))}
        </div>
      ),
      col3: (
        <div className="text-right text-base text-miru-dark-purple-1000">
          {minToHHMM(client.minutes)}
        </div>
      ),
      rowId: client.id,
    }));
  }

  return [{}];
};

const ClientList = ({ isAdminUser }) => {
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [selectedProject, setSelectedProject] = useState({});
  const [projectDetails, setProjectDetails] = useState<any>();
  const [totalMinutes, setTotalMinutes] = useState(null);
  const [clientDetails, setClientDetails] = useState<any>({});
  const [editProjectData, setEditProjectData] = React.useState<any>(null);
  const [overdueOutstandingAmount, setOverdueOutstandingAmount] =
    useState<any>(null);

  const params = useParams();
  const navigate = useNavigate();

  const handleEditClick = id => {
    setShowEditDialog(true);
    const editSelection = projectDetails.find(project => project.id === id);
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
  };

  const fetchProjectList = async () => {
    try {
      const res = await clientApi.show(params.clientId, "?time_frame=week");
      const sanitized = unmapClientDetails(res);
      setClientDetails(sanitized.clientDetails);
      setProjectDetails(sanitized.projectDetails);
      setTotalMinutes(sanitized.totalMinutes);
      setOverdueOutstandingAmount(sanitized.overdueOutstandingAmount);
    } catch (e) {
      Logger.error(e);
      navigate("/clients");
    }
  };

  useEffect(() => {
    sendGAPageView();
    setAuthHeaders();
    registerIntercepts();
    fetchProjectList();
  }, []);

  const tableHeader = [
    {
      Header: "PROJECT",
      accessor: "col1", // accessor is the "key" in the data
      cssClass: "",
    },
    {
      Header: "TEAM",
      accessor: "col2",
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

  const tableData = getTableData(projectDetails);

  return (
    <>
      <ToastContainer autoClose={TOASTER_DURATION} />
      <Header clientDetails={clientDetails} />
      <div>
        {isAdminUser && (
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
                {projectDetails && (
                  <Table
                    hasRowIcons
                    handleDeleteClick={handleDeleteClick}
                    handleEditClick={handleEditClick}
                    tableHeader={tableHeader}
                    tableRowArray={tableData}
                  />
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
        />
      )}
      {showDeleteDialog && (
        <DeleteProject
          fetchProjectList={fetchProjectList}
          project={selectedProject}
          setShowDeleteDialog={setShowDeleteDialog}
        />
      )}
    </>
  );
};

export default ClientList;
