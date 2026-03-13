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
import { Badge } from "../ui/badge";
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
      toast.success("Project deleted successfully");
      setShowDeleteDialog(false);
    },
    onError: () => {
      toast.error("Failed to delete project");
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
        return <CircleWavyCheck size={16} className="text-green-600" />;
      case "paused":
        return <Pause size={16} className="text-yellow-600" />;
      case "completed":
        return <CircleWavyCheck size={16} className="text-blue-600" />;
      default:
        return <HourglassMedium size={16} className="text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Active
          </Badge>
        );
      case "paused":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Paused
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Completed
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
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
          PROJECT/CLIENT
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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <Briefcase size={16} className="text-muted-foreground" />
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
      header: "Client",
      cell: ({ row }) => {
        const clientName =
          row.original.client_name || row.original.client?.name || "No Client";

        return (
          <span className="text-sm font-medium text-foreground">
            {clientName}
          </span>
        );
      },
    },
    {
      accessorKey: "totalHours",
      header: "HOURS LOGGED",
      cell: ({ row }) => {
        const hours = Number(row.original.totalHours || 0);

        return <span className="text-sm">{`${hours.toFixed(1)}h`}</span>;
      },
    },
    {
      accessorKey: "teamMembers",
      header: "Team",
      cell: ({ row }) => {
        const members = row.original.teamMembers || [];
        const displayCount = 3;
        const remainingCount = Math.max(0, members.length - displayCount);

        return (
          <div className="flex flex-wrap gap-1">
            {members.slice(0, displayCount).map(member => (
              <span key={member.id} className="text-sm text-gray-600">
                {member.name}
              </span>
            ))}
            {remainingCount > 0 && (
              <span className="text-sm text-gray-600">
                +{remainingCount} more
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "billable",
      header: "Type",
      cell: ({ row }) =>
        row.original.billable ? (
          <Badge
            variant="outline"
            className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
          >
            Billable
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            Non-billable
          </Badge>
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
          Status
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
                <span className="sr-only">Open menu</span>
                <DotsThree size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(project.id)}
              >
                Copy project ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                View details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(project)}>
                <PencilSimple size={16} className="mr-2" />
                Edit project
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(project)}
                className="text-destructive focus:text-destructive"
              >
                <Trash size={16} className="mr-2" />
                Delete Project
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
          <p className="text-muted-foreground">Failed to load projects</p>
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
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground md:text-base">
            Manage your projects and track progress
          </p>
        </div>
        {isAdminUser && (
          <Button onClick={() => setShowNewProjectDialog(true)}>
            <Plus size={20} className="mr-2" />
            New Project
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Projects
            </CardTitle>
            <Briefcase size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              of {projects.length} total projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Timer size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours.toFixed(0)}h</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Tracked across all projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueTeamMembers}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Working on projects
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
          <CardDescription>
            A comprehensive list of all your projects with team assignments and
            progress tracking.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length > 0 ? (
            <DataTable
              columns={columns}
              data={projects}
              searchPlaceholder="Search projects..."
              onRowClick={project => navigate(`/projects/${project.id}`)}
            />
          ) : (
            <div className="text-center py-12">
              <Briefcase
                size={48}
                className="mx-auto mb-4 text-muted-foreground/50"
              />
              <p className="mb-4 text-muted-foreground">
                Looks like there aren't any projects added yet.
              </p>
              {isAdminUser && (
                <Button
                  variant="outline"
                  onClick={() => setShowNewProjectDialog(true)}
                >
                  <Plus size={20} className="mr-2" />
                  Create Your First Project
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
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedProject?.name}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "DELETE"}
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
