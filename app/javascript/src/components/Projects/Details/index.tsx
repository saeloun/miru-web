import React, { useEffect, useState } from "react";
import { ArrowLeft, DotsThree, Receipt, UsersThree } from "phosphor-react";

import { projectApi } from "apis/api";
import Loader from "common/Loader/index";
import Table from "common/Table";
import { useUserContext } from "context/UserContext";
import { currencySymbol } from "helpers";
import Logger from "js-logger";
import { unmapper } from "mapper/mappedIndex";
import { useParams, useNavigate } from "react-router-dom";
import { sendGAPageView } from "utils/googleAnalytics";
import { Badge } from "components/ui/badge";
import { Button } from "components/ui/button";
import { Card, CardContent } from "components/ui/card";
import { i18n } from "../../../i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "components/ui/dropdown-menu";

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
  const [loading, setLoading] = useState<boolean>(true);
  const [overdueOutstandingAmount, setOverdueOutstandingAmount] =
    useState<any>(null);

  const params = useParams();
  const navigate = useNavigate();
  const projectId = parseInt(params.projectId);
  const { isDesktop } = useUserContext();

  const fetchProject = async (timeframe = null) => {
    try {
      const res = await projectApi.show(params.projectId, timeframe);
      const sanitized = unmapper(res.data.project_details);
      setProject(sanitized);
      setOverdueOutstandingAmount(sanitized.overdueOutstandingAmount);
      setLoading(false);
    } catch (e) {
      Logger.error(e);
      navigate("/projects");
    }
  };

  const handleGenerateInvoice = () => {
    navigate(`/invoices/new?clientId=${project?.client?.id}`);
  };

  const currencySymb = currencySymbol(project?.client_currency);

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

  const backToProjects = () => {
    navigate("/projects");
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="flex h-full w-full">
      <div className="hidden flex-1 flex-col lg:flex">
        <div className="my-6">
          <div className="flex min-w-0 items-center justify-between">
            <div className="flex items-center">
              <Button
                className="mr-3 h-10 w-10 rounded-full"
                size="icon"
                type="button"
                variant="outline"
                onClick={() => {
                  navigate(-1);
                }}
              >
                <ArrowLeft size={18} />
              </Button>
              <h2 className="mr-6 py-1 text-3xl font-extrabold text-foreground sm:truncate sm:text-4xl">
                {project?.name}
              </h2>
              {project?.is_billable && (
                <Badge className="rounded-full bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10">
                  {i18n.t("billable")}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleGenerateInvoice} variant="outline">
                <Receipt size={16} />
                <span>{i18n.t("projects.newInvoice")}</span>
              </Button>
              <Button
                id="addRemoveTeamMembers"
                variant="outline"
                onClick={handleAddRemoveMembers}
              >
                <UsersThree size={16} />
                <span>{i18n.t("projects.manageTeam")}</span>
              </Button>
              <DropdownMenu
                open={isHeaderMenuVisible}
                onOpenChange={open => handleMenuVisibility(undefined, open)}
              >
                <DropdownMenuTrigger asChild>
                  <Button id="kebabMenu" size="icon" variant="outline">
                    <DotsThree size={18} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <HeaderMenuList
                    handleAddRemoveMembers={handleAddRemoveMembers}
                    handleEditProject={handleEditProject}
                    handleGenerateInvoice={handleGenerateInvoice}
                    setIsHeaderMenuVisible={setIsHeaderMenuVisible}
                    setShowDeleteDialog={setShowDeleteDialog}
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <p className="ml-12 mt-1 text-xs text-muted-foreground">
            {project && project.client.name}
          </p>
        </div>
        <TotalHoursChart
          currencySymb={currencySymb}
          overdueOutstandingAmount={overdueOutstandingAmount}
          project={project}
          setTimeframe={setTimeframe}
        />
        <Card className="mt-6 border-border bg-card">
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {i18n.t("projects.teamMembers")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {i18n.t("projects.teamMembersDescription")}
                </p>
              </div>
            </div>
            <div className="overflow-x-auto px-6 py-4">
              {project && (
                <Table tableHeader={tableHeader} tableRowArray={tableData} />
              )}
            </div>
          </CardContent>
        </Card>
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
