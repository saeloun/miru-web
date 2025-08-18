import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table";
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
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { Progress } from "../ui/progress";
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
import { cn } from "../../lib/utils";
import { useUserContext } from "../../context/UserContext";
import projectApi from "../../apis/projects";
import { toast } from "sonner";

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
    setSelectedProject(project);
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
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case "paused":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Paused</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Completed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const columns: ColumnDef<Project>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4"
          >
            Project
            {column.getIsSorted() === "asc" ? (
              <ArrowUp size={16} className="ml-2" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown size={16} className="ml-2" />
            ) : (
              <><CaretUp size={8} className="ml-2 -mb-1" /><CaretDown size={8} className="ml-2 -mt-1" /></>
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        const project = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
              <Briefcase size={16} className="text-gray-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{project.name}</p>
              {project.description && (
                <p className="text-sm text-gray-500 truncate max-w-xs">
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
        const clientName = row.original.client_name || row.original.client?.name || "No Client";
        return (
          <span className="text-sm font-medium text-gray-700">{clientName}</span>
        );
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
            {members.slice(0, displayCount).map((member) => (
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
      id: "progress",
      header: "Progress",
      cell: ({ row }) => {
        const project = row.original;
        const totalHours = project.totalHours || 0;
        const allocatedHours = project.allocatedHours || 0;
        const progressPercentage = allocatedHours > 0
          ? Math.min((totalHours / allocatedHours) * 100, 100)
          : 0;

        return (
          <div className="w-32 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">
                {totalHours.toFixed(1)}h
              </span>
              <span className="text-gray-500">
                / {allocatedHours}h
              </span>
            </div>
            <Progress 
              value={progressPercentage} 
              className="h-2"
            />
          </div>
        );
      },
    },
    {
      accessorKey: "billable",
      header: "Type",
      cell: ({ row }) => {
        return row.original.billable ? (
          <Badge variant="outline" className="text-green-700">Billable</Badge>
        ) : (
          <Badge variant="outline" className="text-gray-600">Non-billable</Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => {
        return (
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
              <><CaretUp size={8} className="ml-2 -mb-1" /><CaretDown size={8} className="ml-2 -mt-1" /></>
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        return getStatusBadge(row.original.status || "active");
      },
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
              <Button variant="ghost" className="h-8 w-8 p-0">
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
              <DropdownMenuItem onClick={() => navigate(`/projects/${project.id}`)}>
                View details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(project)}>
                <PencilSimple size={16} className="mr-2" />
                Edit project
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(project)}
                className="text-red-600"
              >
                <Trash size={16} className="mr-2" />
                Delete project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Warning size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Failed to load projects</p>
        </div>
      </div>
    );
  }

  const projects = data?.projects || [];
  const activeProjects = projects.filter(p => p.status === "active").length;
  const totalHours = projects.reduce((sum, p) => sum + (p.totalHours || 0), 0);
  const teamMembersSet = new Set(projects.flatMap(p => p.teamMembers?.map(m => m.id) || []));
  const uniqueTeamMembers = teamMembersSet.size;

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">
            Manage your projects and track progress
          </p>
        </div>
        {isAdminUser && (
          <Button
            onClick={() => setShowNewProjectDialog(true)}
            className="bg-gray-900 hover:bg-gray-800 text-white"
          >
            <Plus size={20} className="mr-2" />
            New Project
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Briefcase size={20} className="text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects}</div>
            <p className="text-xs text-gray-600 mt-1">
              of {projects.length} total projects
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Timer size={20} className="text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalHours.toFixed(0)}h
            </div>
            <p className="text-xs text-gray-600 mt-1">Tracked across all projects</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users size={20} className="text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueTeamMembers}</div>
            <p className="text-xs text-gray-600 mt-1">Working on projects</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
          <CardDescription>
            A comprehensive list of all your projects with team assignments and progress tracking.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length > 0 ? (
            <DataTable
              columns={columns}
              data={projects}
              searchPlaceholder="Search projects..."
            />
          ) : (
            <div className="text-center py-12">
              <Briefcase size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600 mb-4">No projects created yet</p>
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
              Are you sure you want to delete "{selectedProject?.name}"? This action cannot be undone.
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
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectsTable;