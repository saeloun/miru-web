import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
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
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DotsThree,
  PencilSimple,
  Trash,
  UserPlus,
  Users,
  Crown,
  Shield,
  User,
  Calendar,
  CaretUp,
  CaretDown,
  ArrowUp,
  ArrowDown,
} from "phosphor-react";
import { useUserContext } from "../../context/UserContext";
import { teamApi } from "apis/api";
import { unmapList } from "../../mapper/team.mapper";
import { toast } from "sonner";
import { Roles } from "../../constants/index";
import { getGravatarUrl } from "../../helpers";

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string;
  designation?: string;
  department?: string;
  joinedDate: string;
  lastActive?: string;
  projects?: number;
  hoursLogged?: number;
  billableHours?: number;
  status: "active" | "inactive" | "invited";
}

interface TeamData {
  teamMembers: TeamMember[];
  totalCount: number;
}

const fetchTeamMembers = async (): Promise<TeamData> => {
  const response = await teamApi.get();
  const sanitized = unmapList(response);

  return {
    teamMembers: sanitized,
    totalCount: sanitized.length,
  };
};

const TeamTable: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdminUser, company } = useUserContext();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["team"],
    queryFn: fetchTeamMembers,
  });

  const deleteMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await teamApi.destroy(memberId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
      toast.success("Team member removed successfully");
      setShowDeleteDialog(false);
    },
    onError: () => {
      toast.error("Failed to remove team member");
    },
  });

  const handleEdit = (member: TeamMember) => {
    setSelectedMember(member);
    setShowEditDialog(true);
  };

  const handleDelete = (member: TeamMember) => {
    setSelectedMember(member);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (selectedMember) {
      deleteMutation.mutate(selectedMember.id);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case Roles.OWNER:
        return <Crown size={16} className="text-yellow-600" />;
      case Roles.ADMIN:
        return <Shield size={16} className="text-blue-600" />;
      default:
        return <User size={16} className="text-gray-500" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case Roles.OWNER:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Owner
          </Badge>
        );
      case Roles.ADMIN:
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Admin
          </Badge>
        );
      case Roles.BOOK_KEEPER:
        return (
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
            Bookkeeper
          </Badge>
        );
      case Roles.EMPLOYEE:
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            Employee
          </Badge>
        );
      default:
        return <Badge variant="outline">{role}</Badge>;
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
      case "inactive":
        return (
          <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100">
            Inactive
          </Badge>
        );
      case "invited":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Invited
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const columns: ColumnDef<TeamMember>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Team Member
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
        const member = row.original;
        const gravatarUrl = getGravatarUrl(member.email, 36);

        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={gravatarUrl} alt={member.name} />
              <AvatarImage src={member.avatar} alt={member.name} />
              <AvatarFallback className="bg-gray-100 text-sm">
                {member.firstName?.[0]}
                {member.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-gray-900">{member.name}</p>
              <p className="text-sm text-gray-500">{member.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Role
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
      cell: ({ row }) => getRoleBadge(row.original.role),
    },
    {
      accessorKey: "designation",
      header: "Position",
      cell: ({ row }) => {
        const member = row.original;

        return (
          <div className="text-sm">
            <p className="font-medium text-gray-900">
              {member.designation || "—"}
            </p>
            {member.department && (
              <p className="text-gray-500">{member.department}</p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "projects",
      header: "Projects",
      cell: ({ row }) => {
        const projects = row.original.projects || 0;

        return (
          <div className="text-sm text-gray-600">
            {projects} {projects === 1 ? "project" : "projects"}
          </div>
        );
      },
    },
    {
      accessorKey: "hoursLogged",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Hours
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
        const member = row.original;
        const totalHours = member.hoursLogged || 0;
        const billableHours = member.billableHours || 0;
        const billablePercentage =
          totalHours > 0 ? (billableHours / totalHours) * 100 : 0;

        return (
          <div className="text-sm">
            <p className="font-medium">{totalHours.toFixed(1)}h</p>
            <p className="text-xs text-gray-500">
              {billablePercentage.toFixed(0)}% billable
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const member = row.original;

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
                onClick={() => navigator.clipboard.writeText(member.email)}
              >
                Copy email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate(`/team/${member.id}`)}>
                View profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(member)}>
                <PencilSimple size={16} className="mr-2" />
                Edit member
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(member)}
                className="text-red-600"
              >
                <Trash size={16} className="mr-2" />
                Remove member
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
          <Users size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Failed to load team members</p>
        </div>
      </div>
    );
  }

  const teamMembers = data?.teamMembers || [];
  const activeMembers = teamMembers.filter(m => m.status === "active").length;
  const totalHours = teamMembers.reduce(
    (sum, m) => sum + (m.hoursLogged || 0),
    0
  );

  const totalProjects = teamMembers.reduce(
    (sum, m) => sum + (m.projects || 0),
    0
  );

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team</h1>
          <p className="text-gray-600 mt-1">
            Manage your team members and their roles
          </p>
        </div>
        {isAdminUser && (
          <Button
            onClick={() => setShowInviteDialog(true)}
            className="bg-gray-900 hover:bg-gray-800 text-white"
          >
            <UserPlus size={20} className="mr-2" />
            Invite Member
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users size={20} className="text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
            <p className="text-xs text-gray-600 mt-1">{activeMembers} active</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Calendar size={20} className="text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours.toFixed(0)}h</div>
            <p className="text-xs text-gray-600 mt-1">This month</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Projects
            </CardTitle>
            <Crown size={20} className="text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="text-xs text-gray-600 mt-1">Across all members</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Utilization
            </CardTitle>
            <Shield size={20} className="text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamMembers.length > 0
                ? Math.round(
                    teamMembers.reduce((sum, m) => {
                      const billable = m.billableHours || 0;
                      const total = m.hoursLogged || 0;

                      return sum + (total > 0 ? (billable / total) * 100 : 0);
                    }, 0) / teamMembers.length
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-gray-600 mt-1">Billable hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card className="border-gray-200">
        <CardContent>
          {teamMembers.length > 0 ? (
            <DataTable
              columns={columns}
              data={teamMembers}
              searchPlaceholder="Search team members..."
            />
          ) : (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600 mb-4">No team members yet</p>
              {isAdminUser && (
                <Button
                  variant="outline"
                  onClick={() => setShowInviteDialog(true)}
                >
                  <UserPlus size={20} className="mr-2" />
                  Invite Your First Team Member
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
            <DialogTitle>Remove Team Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedMember?.name} from your
              team? This action cannot be undone.
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
              {deleteMutation.isPending ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamTable;
