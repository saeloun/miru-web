import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import clientApi from "apis/clients";

import AmountBoxContainer from "common/AmountBox";
import ChartBar from "common/ChartBar";
import Table from "common/Table";
import AddEditProject from "components/Projects/Modals/AddEditProject";
import DeleteProject from "components/Projects/Modals/DeleteProject";
import { cashFormatter } from "helpers/cashFormater";
import { currencySymbol } from "helpers/currencySymbol";
import { sendGAPageView } from "utils/googleAnalytics";

import { TOASTER_DURATION } from "constants/index";
import Header from "./Header";
import { unmapClientDetails } from "../../../mapper/client.mapper";

const getTableData = (clients) => {
  if (clients) {
    return clients.map((client) => {
      const hours = (client.minutes / 60).toFixed(2);
      return {
        col1: <div className="text-base text-miru-dark-purple-1000">{client.name}</div>,
        col2: <div className="text-base text-miru-dark-purple-1000">{client.team.map(member => <span>{member},&nbsp;</span>)}</div>,
        col3: <div className="text-base text-miru-dark-purple-1000 text-right">{hours}</div>,
        rowId: client.id
      };
    });
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
  const [overdueOutstandingAmount, setOverDueOutstandingAmt] = useState<any>(null);

  const params = useParams();

  const getClientDetails = () => {
    clientApi.show(params.clientId, "?time_frame=week")
      .then((res) => {
        const sanitized = unmapClientDetails(res);
        setClientDetails(sanitized.clientDetails);
        setProjectDetails(sanitized.projectDetails);
        setTotalMinutes(sanitized.totalMinutes);
        setOverDueOutstandingAmt(sanitized.overdueOutstandingAmount);
      });
  };

  const handleEditClick = (id) => {
    setShowEditDialog(true);
    const editSelection = projectDetails.find(project => project.id === id);
    setSelectedProject(editSelection);
  };

  const handleDeleteClick = (id) => {
    setShowDeleteDialog(true);
    const editSelection = projectDetails.find(project => project.id === id);
    setSelectedProject(editSelection);
  };

  const handleSelectChange = (event) => {
    clientApi.show(params.clientId, `?time_frame=${event.target.value}`)
      .then((res) => {
        const sanitized = unmapClientDetails(res);
        setProjectDetails(sanitized.projectDetails);
        setClientDetails(sanitized.clientDetails);
        setTotalMinutes(sanitized.totalMinutes);
        setOverDueOutstandingAmt(sanitized.overdueOutstandingAmount);
      });
  };

  useEffect(() => {
    sendGAPageView();
    setAuthHeaders();
    registerIntercepts();
    getClientDetails();
  }, []);

  const tableHeader = [
    {
      Header: "PROJECT",
      accessor: "col1", // accessor is the "key" in the data
      cssClass: ""
    },
    {
      Header: "TEAM",
      accessor: "col2",
      cssClass: ""
    },
    {
      Header: "HOURS LOGGED",
      accessor: "col3",
      cssClass: "text-right" // accessor is the "key" in the data
    }
  ];

  const currencySymb = currencySymbol(overdueOutstandingAmount?.currency);

  const amountBox = [{
    title: "OVERDUE",
    amount: currencySymb + cashFormatter(overdueOutstandingAmount?.overdue_amount)
  },
  {
    title: "OUTSTANDING",
    amount: currencySymb + cashFormatter(overdueOutstandingAmount?.outstanding_amount)
  }];

  const tableData = getTableData(projectDetails);

  return (
    <>
      <ToastContainer autoClose={TOASTER_DURATION} />
      <Header clientDetails={clientDetails} />
      <div>
        {isAdminUser && <div className="bg-miru-gray-100 py-10 px-10">
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
          {projectDetails && <ChartBar data={projectDetails} totalMinutes={totalMinutes} />}
          <AmountBoxContainer amountBox={amountBox} />
        </div>
        }
        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="overflow-hidden">
                {projectDetails && <Table
                  handleEditClick={handleEditClick}
                  handleDeleteClick={handleDeleteClick}
                  hasRowIcons={true}
                  tableHeader={tableHeader}
                  tableRowArray={tableData}
                />}
              </div>
            </div>
          </div>
        </div>
      </div>
      {showEditDialog &&
        <AddEditProject
          setShowProjectModal={setShowEditDialog}
          setEditProjectData={setEditProjectData}
          editProjectData={editProjectData}
          projectData={selectedProject}
        />
      }
      {showDeleteDialog && (
        <DeleteProject
          setShowDeleteDialog={setShowDeleteDialog}
          project={selectedProject}
          fetchProjects={getClientDetails}
        />
      )}
    </>
  );
};

export default ClientList;
