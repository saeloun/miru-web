import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table";
import Loader from "common/Loader/index";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { DataTable } from "../ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Plus,
  DotsThree,
  PencilSimple,
  Trash,
  Briefcase,
  Timer,
  Users,
  Warning,
  CaretUp,
  CaretDown,
  ArrowUp,
  ArrowDown,
  CircleWavyCheck,
  HourglassMedium,
  Pause,
} from "phosphor-react";
import { useUserContext } from "../../context/UserContext";
import { projectApi } from "apis/api";
import { toast } from "sonner";
import { i18n } from "../../i18n";
import AddEditProject from "./Modals/AddEditProject";

interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  email: string;
}

interface Project {
  id: string;
  name: string;
  client_id?: string;
  client_name?: string;
  client?: {
    id: string;
    name: string;
    logo?: string;
  };
  status?: "active" | "paused" | "completed";
  billable: boolean;
  totalHours?: number;
  allocatedHours?: number;
  teamMembers?: TeamMember[];
  startDate?: string;
  endDate?: string;
  description?: string;
  hourlyRate?: number;
  created_at?: string;
  updated_at?: string;
}

interface ProjectsData {
  projects: Project[];
}

const fetchProjects = async (): Promise<ProjectsData> => {
  const res = await projectApi.get();

  return res.data;
};

const ProjectsTable: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdminUser, company } = useUserContext();
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });

  const deleteMutation = useMutation({
    mutationFn: async (projectId: string) => {
      await projectApi.destroy(projectId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success(i18n.t("projects.projectDeletedSuccessfully"));
      setShowDeleteDialog(false);
    },
    onError: () => {
      toast.error(i18n.t("projects.failedToDeleteProject"));
    },
  });

  const handleEdit = (project: Project) => {
    setSelectedProject({
      ...project,
      clientName: project.client_name || project.client?.name || "",
      isBillable: project.billable,
    } as any);
    setShowEditDialog(true);
  };

  const handleDelete = (project: Project) => {
    setSelectedProject(project);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (selectedProject) {
      deleteMutation.mutate(selectedProject.id);
    }
  };

  const refreshProjectList = () => {
    queryClient.invalidateQueries({ queryKey: ["projects"] });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CircleWavyCheck size={16} className="text-foreground" />;
      case "paused":
        return <Pause size={16} className="text-muted-foreground" />;
      case "completed":
        return <CircleWavyCheck size={16} className="text-foreground" />;
      default:
        return <HourglassMedium size={16} className="text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="text-sm font-medium text-foreground">{i18n.t("projects.active")}</span>
        );
      case "paused":
        return (
          <span className="text-sm font-medium text-foreground">{i18n.t("projects.paused")}</span>
        );
      case "completed":
        return (
          <span className="text-sm font-medium text-foreground">{i18n.t("projects.completed")}</span>
        );
      default:
        return (
          <span className="text-sm font-medium text-muted-foreground">
            {i18n.t("projects.unknown")}
          </span>
        );
    }
  };

  const columns: ColumnDef<Project>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          {i18n.t("projects.projectClient")}
          {column.getIsSorted() === "asc" ? (
            <ArrowUp size={16} className="ml-2" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown size={16} className="ml-2" />
          ) : (
            <>
              <CaretUp size={8} className="ml-2 -mb-1" />
              <CaretDown size={8} className="ml-2 -mt-1" />
            </>
          )}
        </Button>
      ),
      cell: ({ row }) => {
        const project = row.original;

        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
              <Briefcase size={16} />
            </div>
            <div>
              <p className="font-medium text-foreground">{project.name}</p>
              {project.description && (
                <p className="max-w-xs truncate text-sm text-muted-foreground">
                  {project.description}
                </p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "client_name",
      header: i18n.t("client"),
      cell: ({ row }) => {
        const clientName =
          row.original.client_name || row.original.client?.name || i18n.t("projects.noClient");

        return (
          <span className="text-sm font-medium text-foreground">
            {clientName}
          </span>
        );
      },
    },
    {
      accessorKey: "totalHours",
      header: i18n.t("projects.hoursLogged"),
      cell: ({ row }) => {
        const hours = Number(row.original.totalHours || 0);

        return <span className="text-sm">{`${hours.toFixed(1)}h`}</span>;
      },
    },
    {
      accessorKey: "teamMembers",
      header: i18n.t("projects.team"),
      cell: ({ row }) => {
        const members = row.original.teamMembers || [];
        const displayCount = 3;
        const remainingCount = Math.max(0, members.length - displayCount);

        return (
          <div className="flex flex-wrap gap-1">
            {members.slice(0, displayCount).map(member => (
              <span key={member.id} className="text-sm text-muted-foreground">
                {member.name}
              </span>
            ))}
            {remainingCount > 0 && (
              <span className="text-sm text-muted-foreground">
                +{remainingCount} {i18n.t("projects.more")}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "billable",
      header: i18n.t("type"),
      cell: ({ row }) =>
        row.original.billable ? (
          <span className="text-sm font-medium text-foreground">{i18n.t("billable")}</span>
        ) : (
          <span className="text-sm font-medium text-muted-foreground">
            {i18n.t("nonBillable")}
          </span>
        ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          {i18n.t("status")}
          {column.getIsSorted() === "asc" ? (
            <ArrowUp size={16} className="ml-2" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown size={16} className="ml-2" />
          ) : (
            <>
              <CaretUp size={8} className="ml-2 -mb-1" />
              <CaretDown size={8} className="ml-2 -mt-1" />
            </>
          )}
        </Button>
      ),
      cell: ({ row }) => getStatusBadge(row.original.status || "active"),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const project = row.original;

        if (!isAdminUser) return null;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button id="kebabMenu" variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">{i18n.t("openMenu")}</span>
                <DotsThree size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{i18n.t("actions")}</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(project.id)}
              >
                {i18n.t("projects.copyProjectId")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                {i18n.t("projects.viewDetails")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(project)}>
                <PencilSimple size={16} className="mr-2" />
                {i18n.t("projects.editProject")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(project)}
                className="text-destructive focus:text-destructive"
              >
                <Trash size={16} className="mr-2" />
                {i18n.t("projects.deleteProject")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (isLoading) {
    return <Loader className="h-96" />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Warning size={48} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">{i18n.t("projects.failedToLoadProjects")}</p>
        </div>
      </div>
    );
  }

  const projects = data?.projects || [];
  const activeProjects = projects.filter(p => p.status === "active").length;
  const totalHours = projects.reduce((sum, p) => sum + (p.totalHours || 0), 0);
  const teamMembersSet = new Set(
    projects.flatMap(p => p.teamMembers?.map(m => m.id) || [])
  );
  const uniqueTeamMembers = teamMembersSet.size;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 pb-6 pt-2 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground md:text-base">
            {i18n.t("projects.manageProjectsDescription")}
          </p>
        </div>
        {isAdminUser && (
          <Button onClick={() => setShowNewProjectDialog(true)}>
            <Plus size={20} className="mr-2" />
            {i18n.t("projects.newProject")}
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {i18n.t("projects.activeProjects")}
            </CardTitle>
            <Briefcase size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {i18n.t("projects.ofTotalProjects", { count: projects.length })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{i18n.t("projects.totalHours")}</CardTitle>
            <Timer size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours.toFixed(0)}h</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {i18n.t("projects.trackedAcrossAllProjects")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{i18n.t("projects.teamMembers")}</CardTitle>
            <Users size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueTeamMembers}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {i18n.t("projects.workingOnProjects")}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{i18n.t("projects.allProjects")}</CardTitle>
          <CardDescription>
            {i18n.t("projects.allProjectsDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length > 0 ? (
            <DataTable
              columns={columns}
              data={projects}
              searchPlaceholder={i18n.t("projects.searchProjects")}
              onRowClick={project => navigate(`/projects/${project.id}`)}
            />
          ) : (
            <div className="py-12 text-center">
              <Briefcase
                size={48}
                className="mx-auto mb-4 text-muted-foreground/50"
              />
              <p className="mb-4 text-muted-foreground">
                {i18n.t("projects.noProjectsYet")}
              </p>
              {isAdminUser && (
                <Button
                  variant="outline"
                  onClick={() => setShowNewProjectDialog(true)}
                >
                  <Plus size={20} className="mr-2" />
                  {i18n.t("projects.createFirstProject")}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{i18n.t("projects.deleteProject")}</DialogTitle>
            <DialogDescription>
              {i18n.t("projects.deleteProjectConfirm", { name: selectedProject?.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              {i18n.t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? i18n.t("projects.deleting") : i18n.t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showNewProjectDialog && (
        <AddEditProject
          setEditProjectData={setSelectedProject as any}
          editProjectData={{}}
          setShowProjectModal={setShowNewProjectDialog}
          showProjectModal={showNewProjectDialog}
          projectData={{}}
          fetchProjectList={refreshProjectList}
        />
      )}

      {showEditDialog && selectedProject && (
        <AddEditProject
          setEditProjectData={setSelectedProject as any}
          editProjectData={selectedProject as any}
          setShowProjectModal={setShowEditDialog}
          showProjectModal={showEditDialog}
          projectData={selectedProject as any}
          fetchProjectList={refreshProjectList}
        />
      )}
    </div>
  );
};

export default ProjectsTable;
