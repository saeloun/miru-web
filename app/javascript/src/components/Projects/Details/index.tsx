import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import { setAuthHeaders, registerIntercepts } from "apis/axios";
import projectAPI from "apis/projects";

import AmountBoxContainer from "common/AmountBox";
import ChartBar from "common/ChartBar";
import Table from "common/Table";

import { cashFormatter } from "helpers/cashFormater";
import { currencySymbol } from "helpers/currencySymbol";
import {
  ArrowLeft,
  DotsThreeVertical,
  Receipt,
  Pencil,
  UsersThree,
  Trash
} from "phosphor-react";
import EditMembersList from "./EditMembersList";
import { TOASTER_DURATION } from "../../../constants/index";
import { unmapper } from "../../../mapper/project.mapper";
import AddEditProject from "../Modals/AddEditProject";
import DeleteProject from "../Modals/DeleteProject";

const getTableData = (project) => {
  if (project) {
    return project.members.map((member) => {
      const hours = member.minutes / 60;
      const hour = hours.toFixed(2);
      const cost = (hours * parseInt(member.hourlyRate)).toFixed(2);
      return {
        col1: (
          <div className="text-base text-miru-dark-purple-1000">
            {member.name}
          </div>
        ),
        col2: (
          <div className="text-base text-miru-dark-purple-1000 text-right">
            ${member.hourlyRate}
          </div>
        ),
        col3: (
          <div className="text-base text-miru-dark-purple-1000 text-right">
            {hour}
          </div>
        ),
        col4: (
          <div className="text-lg font-bold text-miru-dark-purple-1000 text-right">
            ${cost}
          </div>
        )
      };
    });
  }
};

const ProjectDetails = () => {
  const [editProjectData, setEditProjectData] = React.useState<any>(null);
  const [isHeaderMenuVisible, setHeaderMenuVisibility] = React.useState<boolean>(false);
  const [project, setProject] = React.useState<any>();
  const [showAddMemberDialog, setShowAddMemberDialog] = React.useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState<boolean>(false);
  const [showProjectModal, setShowProjectModal] = React.useState<boolean>(false);
  const [timeframe, setTimeframe] = React.useState<any>("week");
  const [overdueOutstandingAmount, setOverDueOutstandingAmt]= React.useState<any>(null);

  const params = useParams();
  const navigate = useNavigate();
  const projectId = parseInt(params.projectId);

  const fetchProject = async (timeframe = null) => {
    try {
      const res = await projectAPI.show(params.projectId, timeframe);
      const sanitized = unmapper(res.data.project_details);
      setProject(sanitized);
      setOverDueOutstandingAmt(sanitized.overdueOutstandingAmount);
    } catch (e) {
      console.log(e); // eslint-disable-line
    }
  };

  const handleAddProjectDetails = () => {
    fetchProject();
  };

  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
    fetchProject(timeframe);
  }, [timeframe]);

  //check with Ajinkya why tableData is not updating
  const tableData = getTableData(project);

  const tableHeader = [
    {
      Header: "TEAM MEMBER",
      accessor: "col1", // accessor is the "key" in the data
      cssClass: ""
    },
    {
      Header: "HOURLY RATE",
      accessor: "col2",
      cssClass: "text-right"
    },
    {
      Header: "HOURS LOGGED",
      accessor: "col3",
      cssClass: "text-right" // accessor is the "key" in the data
    },
    {
      Header: "COST",
      accessor: "col4",
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

  const handleMenuVisibility = () => {
    setHeaderMenuVisibility(!isHeaderMenuVisible);
  };

  const handleAddRemoveMembers = () => {
    handleMenuVisibility();
    setShowAddMemberDialog(true);
  };

  const closeAddRemoveMembers = () => {
    setShowAddMemberDialog(false);
  };

  const handleEditProject = () => {
    setShowProjectModal(true);
    setEditProjectData({
      id: project.id,
      isBillable: project.is_billable,
      name: project.name,
      client: project.client
    });
  };

  const menuBackground = isHeaderMenuVisible ? "bg-miru-gray-1000" : "";

  return (
    <>
      <ToastContainer autoClose={TOASTER_DURATION} />
      <div className="my-6">
        <div className="flex min-w-0 items-center justify-between">
          <div className="flex items-center">
            <button
              className="button-icon__back"
              onClick={() => {
                navigate("/projects");
              }}
            >
              <ArrowLeft size={20} color="#5b34ea" weight="bold" />
            </button>
            <h2 className="text-3xl mr-6 font-extrabold text-gray-900 sm:text-4xl sm:truncate py-1">
              {project?.name}
            </h2>
            {project?.is_billable && (
              <span className="rounded-xl text-xs self-center  tracking-widest font-semibold px-1 bg-miru-han-purple-100 text-miru-han-purple-1000">
                BILLABLE
              </span>
            )}
          </div>
          <div className="relative h-8">
            <button
              onClick={handleMenuVisibility}
              className={`menuButton__button ${menuBackground}`}
            >
              <DotsThreeVertical size={20} color="#000000" />
            </button>
            {isHeaderMenuVisible && (
              <ul className="menuButton__wrapper">
                <li>
                  <button
                    onClick={() =>
                      document.location.assign(
                        window.location.origin +
                        "/invoices/generate?" +
                        project.client.name
                      )
                    }
                    className="menuButton__list-item"
                  >
                    <Receipt size={16} color="#5B34EA" weight="bold" />
                    <span className="ml-3">Generate Invoice</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      handleEditProject();
                      setHeaderMenuVisibility(false);
                    }}
                    className="menuButton__list-item"
                  >
                    <Pencil size={16} color="#5b34ea" weight="bold" />
                    <span className="ml-3">Edit Project Details</span>
                  </button>
                </li>
                <li>
                  <button
                    className="menuButton__list-item"
                    onClick={handleAddRemoveMembers}
                  >
                    <UsersThree size={16} color="#5b34ea" weight="bold" />
                    <span className="ml-3">Add/Remove Team Members</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setShowDeleteDialog(true)}
                    className="menuButton__list-item text-miru-red-400"
                  >
                    <Trash size={16} color="#E04646" weight="bold" />
                    <span className="ml-3">Delete Project</span>
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>
        <p className="text-xs ml-12 mt-1 text-miru-dark-purple-400">
          {project && project.client.name}
        </p>
      </div>
      <div className="bg-miru-gray-100 py-10 px-10">
        <div className="flex justify-end">
          <select
            className="px-3
              py-1.5
              text-base
              font-normal
              bg-transparent bg-clip-padding bg-no-repeat
              border-none
              transition
              ease-in-out
              m-0
              focus:outline-none
              text-miru-han-purple-1000"
            onChange={ ({ target: { value } }) => setTimeframe(value) }
          >
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
        {project && (
          <ChartBar
            data={project.members}
            totalMinutes={project.totalMinutes}
          />
        )}
        <AmountBoxContainer amountBox={amountBox} />
      </div>
      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="overflow-hidden">
              {project && (
                <Table tableHeader={tableHeader} tableRowArray={tableData} />
              )}
            </div>
          </div>
        </div>
      </div>
      {showAddMemberDialog ? (
        <EditMembersList
          setShowAddMemberDialog={setShowAddMemberDialog}
          addedMembers={project?.members}
          handleAddProjectDetails={handleAddProjectDetails}
          closeAddRemoveMembers={closeAddRemoveMembers}
          projectId={projectId}
        />
      ) : null}
      {showProjectModal && (
        <AddEditProject
          editProjectData={editProjectData}
          setEditProjectData={setEditProjectData}
          setShowProjectModal={setShowProjectModal}
        />
      )}
      {showDeleteDialog && (
        <DeleteProject
          setShowDeleteDialog={setShowDeleteDialog}
          project={project}
        />
      )}
    </>
  );
};
export default ProjectDetails;
