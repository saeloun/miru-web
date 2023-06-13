import React, { useEffect, useState } from "react";

import { currencySymbol } from "helpers";
import Logger from "js-logger";
import { ArrowLeftIcon, DotsThreeVerticalIcon } from "miruIcons";
import { useParams, useNavigate } from "react-router-dom";
import { Badge } from "StyledComponents";

import projectAPI from "apis/projects";
import Table from "common/Table";
import { useUserContext } from "context/UserContext";
import { unmapper } from "mapper/mappedIndex";
import { sendGAPageView } from "utils/googleAnalytics";

import EditMembersList from "./EditMembersList";
import HeaderMenuList from "./HeadermenuList";
import MemberListForm from "./Mobile/MemberListForm";
import ProjectDetailsForm from "./Mobile/ProjectDetailsForm";
import TableData from "./TableData";
import TotalHoursChart from "./TotalHoursChart";

import { tableHeader } from "../constants";
import ProjectForm from "../List/Mobile/ProjectForm";
import AddEditProject from "../Modals/AddEditProject";
import DeleteProject from "../Modals/DeleteProject";

const ProjectDetails = () => {
  const [editProjectData, setEditProjectData] = useState<any>(null);
  const [isHeaderMenuVisible, setIsHeaderMenuVisible] =
    useState<boolean>(false);
  const [project, setProject] = useState<any>();
  const [showAddMemberDialog, setShowAddMemberDialog] =
    useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [showProjectModal, setShowProjectModal] = useState<boolean>(false);
  const [timeframe, setTimeframe] = useState<any>("week");
  const [overdueOutstandingAmount, setOverdueOutstandingAmount] =
    useState<any>(null);

  const params = useParams();
  const navigate = useNavigate();
  const projectId = parseInt(params.projectId);
  const { isDesktop } = useUserContext();

  const fetchProject = async (timeframe = null) => {
    try {
      const res = await projectAPI.show(params.projectId, timeframe);
      const sanitized = unmapper(res.data.project_details);
      setProject(sanitized);
      setOverdueOutstandingAmount(sanitized.overdueOutstandingAmount);
    } catch (e) {
      Logger.error(e);
      navigate("/projects");
    }
  };

  const handleGenerateInvoice = () => {
    navigate(`/invoices/generate/?clientId=${project?.client?.id}`);
  };

  const currencySymb = currencySymbol(project?.currency);

  const handleAddProjectDetails = () => {
    fetchProject();
  };

  useEffect(() => {
    sendGAPageView();
    fetchProject(timeframe);
  }, [timeframe]);

  const tableData = TableData(project, currencySymb);

  const handleMenuVisibility = (e?: any, isMenuVisible?: boolean) => {
    e?.stopPropagation();
    const tempIsMenuVisible = isMenuVisible ?? !isHeaderMenuVisible;
    setIsHeaderMenuVisible(tempIsMenuVisible);
  };

  const handleAddRemoveMembers = e => {
    e?.stopPropagation();
    setShowAddMemberDialog(true);
    setIsHeaderMenuVisible(false);
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
      client: project.client,
    });
  };

  const getMobileCurrentForm = () => {
    if (showAddMemberDialog && !isDesktop) {
      return (
        <MemberListForm
          addedMembers={project?.members}
          closeAddRemoveMembers={closeAddRemoveMembers}
          currencySymbol={currencySymb}
          handleAddProjectDetails={handleAddProjectDetails}
          projectId={projectId}
        />
      );
    }

    if (showProjectModal && !isDesktop) {
      return (
        <ProjectForm
          editProjectData={editProjectData}
          fetchProjects={fetchProject}
          setEditProjectData={setEditProjectData}
          setShowProjectModal={setShowProjectModal}
        />
      );
    }

    if (!isDesktop) {
      return (
        <ProjectDetailsForm
          handleAddRemoveMembers={handleAddRemoveMembers}
          handleEditProject={handleEditProject}
          handleGenerateInvoice={handleGenerateInvoice}
          isHeaderMenuVisible={isHeaderMenuVisible}
          project={project}
          setIsHeaderMenuVisible={setIsHeaderMenuVisible}
          setShowDeleteDialog={setShowDeleteDialog}
        />
      );
    }

    return <div />;
  };

  const menuBackground = isHeaderMenuVisible ? "bg-miru-gray-100" : "";

  const backToProjects = () => {
    navigate("/projects");
  };

  return (
    <div className="flex h-full w-full">
      <div className="hidden flex-1 flex-col lg:flex">
        <div className="my-6">
          <div className="flex min-w-0 items-center justify-between">
            <div className="flex items-center">
              <button
                className="button-icon__back"
                onClick={() => {
                  navigate("/projects");
                }}
              >
                <ArrowLeftIcon color="#5b34ea" size={20} weight="bold" />
              </button>
              <h2 className="mr-6 py-1 text-3xl font-extrabold text-gray-900 sm:truncate sm:text-4xl">
                {project?.name}
              </h2>
              {project?.is_billable && (
                <Badge
                  bgColor="bg-miru-han-purple-100"
                  className="tracking-wide rounded-xl uppercase"
                  color="text-miru-han-purple-1000"
                  text="billable"
                />
              )}
            </div>
            <div className="relative h-8">
              <button
                className={`menuButton__button ${menuBackground}`}
                id="kebabMenu"
                onClick={handleMenuVisibility}
              >
                <DotsThreeVerticalIcon color="#000000" size={20} />
              </button>
              {isHeaderMenuVisible && (
                <ul className="menuButton__wrapper">
                  <HeaderMenuList
                    handleAddRemoveMembers={handleAddRemoveMembers}
                    handleEditProject={handleEditProject}
                    handleGenerateInvoice={handleGenerateInvoice}
                    setIsHeaderMenuVisible={setIsHeaderMenuVisible}
                    setShowDeleteDialog={setShowDeleteDialog}
                  />
                </ul>
              )}
            </div>
          </div>
          <p className="ml-12 mt-1 text-xs text-miru-dark-purple-400">
            {project && project.client.name}
          </p>
        </div>
        <TotalHoursChart
          currencySymb={currencySymb}
          overdueOutstandingAmount={overdueOutstandingAmount}
          project={project}
          setTimeframe={setTimeframe}
        />
        <div className="flex flex-col">
          <div className="overflow-XIcon-auto -my-2 sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden">
                {project && (
                  <Table tableHeader={tableHeader} tableRowArray={tableData} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {getMobileCurrentForm()}
      {showAddMemberDialog && isDesktop && (
        <EditMembersList
          addedMembers={project?.members}
          closeAddRemoveMembers={closeAddRemoveMembers}
          currencySymbol={currencySymb}
          handleAddProjectDetails={handleAddProjectDetails}
          projectId={projectId}
        />
      )}
      {showProjectModal && isDesktop && (
        <AddEditProject
          editProjectData={editProjectData}
          fetchProjectList={fetchProject}
          setEditProjectData={setEditProjectData}
          setShowProjectModal={setShowProjectModal}
          showProjectModal={showProjectModal}
        />
      )}
      {showDeleteDialog && (
        <DeleteProject
          fetchProjectList={backToProjects}
          project={project}
          setShowDeleteDialog={setShowDeleteDialog}
          showDeleteDialog={showDeleteDialog}
        />
      )}
    </div>
  );
};
export default ProjectDetails;
