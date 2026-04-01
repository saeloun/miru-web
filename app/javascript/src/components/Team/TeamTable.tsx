import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table";
import Loader from "common/Loader/index";
import { i18n } from "../../i18n";
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
import { unmapList, unmapPagyData } from "../../mapper/team.mapper";
import { toast } from "sonner";
import { Roles } from "../../constants/index";
import { getDisplayAvatarUrl } from "../../helpers";

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

interface TeamMemberFormState {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

const fetchTeamMembers = async (): Promise<TeamData> => {
  const response = await teamApi.get("page=1&items=1000");
  const teamMembers = unmapList(response);
  const pagy = unmapPagyData(response);

  return {
    teamMembers,
    totalCount: pagy?.count || teamMembers.length,
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

  const [memberForm, setMemberForm] = useState<TeamMemberFormState>({
    firstName: "",
    lastName: "",
    email: "",
    role: Roles.EMPLOYEE,
  });

  const teamSeatLimitReached =
    !company?.pro_access && Boolean(company?.team_member_limit_reached);

  const deleteMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await teamApi.destroyTeamMember(memberId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
      toast.success(i18n.t("team.deleteUser"));
      setShowDeleteDialog(false);
    },
    onError: () => {
      toast.error(i18n.t("team.failedToLoadTeamMembers"));
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async (payload: TeamMemberFormState) =>
      teamApi.inviteMember({
        first_name: payload.firstName,
        last_name: payload.lastName,
        email: payload.email,
        recipient_email: payload.email,
        role: payload.role,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
      toast.success(i18n.t("team.inviteMember"));
      setShowInviteDialog(false);
      setMemberForm({
        firstName: "",
        lastName: "",
        email: "",
        role: Roles.EMPLOYEE,
      });
    },
    onError: error => {
      toast.error(
        error?.response?.data?.errors || i18n.t("team.failedToLoadTeamMembers")
      );
    },
  });

  const editMutation = useMutation({
    mutationFn: async (payload: TeamMemberFormState) => {
      if (!selectedMember) throw new Error("No team member selected");

      if (selectedMember.status === "invited") {
        return teamApi.updateInvitedMember(selectedMember.id, {
          first_name: payload.firstName,
          last_name: payload.lastName,
          email: payload.email,
          recipient_email: payload.email,
          role: payload.role,
        });
      }

      return teamApi.updateTeamMember(selectedMember.id, {
        first_name: payload.firstName,
        last_name: payload.lastName,
        email: payload.email,
        role: payload.role,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
      toast.success(i18n.t("team.editMember"));
      setShowEditDialog(false);
      setSelectedMember(null);
    },
    onError: error => {
      toast.error(
        error?.response?.data?.errors || i18n.t("team.failedToLoadTeamMembers")
      );
    },
  });

  const handleEdit = (member: TeamMember) => {
    setSelectedMember(member);
    setMemberForm({
      firstName: member.firstName || "",
      lastName: member.lastName || "",
      email: member.email || "",
      role: member.role || Roles.EMPLOYEE,
    });
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
        return <User size={16} className="text-muted-foreground" />;
    }
  };

  const handleInviteOpen = () => {
    setMemberForm({
      firstName: "",
      lastName: "",
      email: "",
      role: Roles.EMPLOYEE,
    });
    setShowInviteDialog(true);
  };

  const handleDialogClose = (setter: (value: boolean) => void) => value => {
    setter(value);
    if (!value) {
      setSelectedMember(null);
    }
  };

  const handleMemberFormChange =
    (field: keyof TeamMemberFormState) => (event: React.ChangeEvent<any>) => {
      setMemberForm(previous => ({ ...previous, [field]: event.target.value }));
    };

  const memberFormComplete =
    memberForm.firstName.trim() &&
    memberForm.lastName.trim() &&
    memberForm.email.trim() &&
    memberForm.role.trim();

  const getRoleBadge = (role: string) => {
    switch (role) {
      case Roles.OWNER:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            {i18n.t("team.owner")}
          </Badge>
        );
      case Roles.ADMIN:
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            {i18n.t("team.admin")}
          </Badge>
        );
      case Roles.BOOK_KEEPER:
        return (
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
            {i18n.t("team.bookkeeper")}
          </Badge>
        );
      case Roles.EMPLOYEE:
        return (
          <Badge className="border-border bg-muted text-foreground hover:bg-muted">
            {i18n.t("team.employee")}
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
            {i18n.t("active")}
          </Badge>
        );
      case "inactive":
        return (
          <Badge className="border-border bg-muted text-muted-foreground hover:bg-muted">
            {i18n.t("inactive")}
          </Badge>
        );
      case "invited":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            {i18n.t("invited")}
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
          {i18n.t("team.team")}
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
        const avatarUrl = getDisplayAvatarUrl(member.avatar, member.email, 36);

        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={avatarUrl} alt={member.name} />
              <AvatarFallback className="bg-muted text-sm text-foreground">
                {member.firstName?.[0]}
                {member.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">{member.name}</p>
              <p className="text-sm text-muted-foreground">{member.email}</p>
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
          {i18n.t("role")}
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
      header: i18n.t("team.position"),
      cell: ({ row }) => {
        const member = row.original;

        return (
          <div className="text-sm">
            <p className="font-medium text-foreground">
              {member.designation || "—"}
            </p>
            {member.department && (
              <p className="text-muted-foreground">{member.department}</p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "projects",
      header: i18n.t("navbar.projects"),
      cell: ({ row }) => {
        const projects = row.original.projects || 0;

        return (
          <div className="text-sm text-muted-foreground">
            {projects} {i18n.t("navbar.projects")}
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
          {i18n.t("hours")}
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
            <p className="font-medium text-foreground">
              {totalHours.toFixed(1)}h
            </p>
            <p className="text-xs text-muted-foreground">
              {billablePercentage.toFixed(0)}% {i18n.t("billable")}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: i18n.t("status"),
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
                <span className="sr-only">{i18n.t("openMenu")}</span>
                <DotsThree size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{i18n.t("actions")}</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(member.email)}
              >
                {i18n.t("team.copyEmail")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate(`/team/${member.id}`)}>
                {i18n.t("team.viewProfile")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(member)}>
                <PencilSimple size={16} className="mr-2" />
                {i18n.t("team.editMember")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(member)}
                className="text-destructive"
              >
                <Trash size={16} className="mr-2" />
                {i18n.t("team.deleteUser")}
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
          <Users size={48} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            {i18n.t("team.failedToLoadTeamMembers")}
          </p>
        </div>
      </div>
    );
  }

  const teamMembers = data?.teamMembers || [];
  const totalCount = data?.totalCount || teamMembers.length;
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
          <p className="mt-1 text-muted-foreground">
            {i18n.t("team.teamOverview")}
          </p>
        </div>
        {isAdminUser && (
          <div className="flex flex-col items-start gap-2 md:items-end">
            <Button
              onClick={handleInviteOpen}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={teamSeatLimitReached}
            >
              <UserPlus size={20} className="mr-2" />
              {i18n.t("team.inviteMember")}
            </Button>
            {teamSeatLimitReached && (
              <button
                type="button"
                className="text-sm font-medium text-primary hover:underline"
                onClick={() => navigate("/settings/billing")}
              >
                {i18n.t("team.upgradePlan")}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {i18n.t("team.totalMembers")}
            </CardTitle>
            <Users size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {activeMembers} {i18n.t("active")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {i18n.t("team.totalHours")}
            </CardTitle>
            <Calendar size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours.toFixed(0)}h</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {i18n.t("thisMonth")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {i18n.t("team.activeProjects")}
            </CardTitle>
            <Crown size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {i18n.t("team.acrossAllMembers")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {i18n.t("team.avgUtilization")}
            </CardTitle>
            <Shield size={20} className="text-muted-foreground" />
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
            <p className="mt-1 text-xs text-muted-foreground">
              {i18n.t("team.billableHours")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card className="border-border">
        <CardContent>
          {teamMembers.length > 0 ? (
            <DataTable
              columns={columns}
              data={teamMembers}
              searchPlaceholder={i18n.t("search")}
              showPagination={false}
            />
          ) : (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto mb-4 text-muted-foreground" />
              <p className="mb-4 text-muted-foreground">
                {i18n.t("team.noTeamMembersYet")}
              </p>
              {isAdminUser && (
                <Button
                  variant="outline"
                  onClick={handleInviteOpen}
                  disabled={teamSeatLimitReached}
                >
                  <UserPlus size={20} className="mr-2" />
                  {i18n.t("team.inviteMember")}
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
            <DialogTitle>{i18n.t("team.deleteUser")}</DialogTitle>
            <DialogDescription>
              {i18n.t("team.deleteUserConfirm", { name: selectedMember?.name })}
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
              {deleteMutation.isPending
                ? i18n.t("team.removing")
                : i18n.t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showInviteDialog}
        onOpenChange={handleDialogClose(setShowInviteDialog)}
      >
        <DialogContent className="border-border bg-card text-foreground sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{i18n.t("team.inviteMember")}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {i18n.t("team.teamOverview")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="invite-member-first-name"
                className="text-sm font-medium text-foreground"
              >
                {i18n.t("contacts.firstName")}
              </label>
              <input
                id="invite-member-first-name"
                name="firstName"
                value={memberForm.firstName}
                onChange={handleMemberFormChange("firstName")}
                className="flex h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="invite-member-last-name"
                className="text-sm font-medium text-foreground"
              >
                {i18n.t("contacts.lastName")}
              </label>
              <input
                id="invite-member-last-name"
                name="lastName"
                value={memberForm.lastName}
                onChange={handleMemberFormChange("lastName")}
                className="flex h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label
                htmlFor="invite-member-email"
                className="text-sm font-medium text-foreground"
              >
                {i18n.t("email")}
              </label>
              <input
                id="invite-member-email"
                name="email"
                type="email"
                value={memberForm.email}
                onChange={handleMemberFormChange("email")}
                className="flex h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label
                htmlFor="invite-member-role"
                className="text-sm font-medium text-foreground"
              >
                {i18n.t("role")}
              </label>
              <select
                id="invite-member-role"
                name="role"
                value={memberForm.role}
                onChange={handleMemberFormChange("role")}
                className="flex h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value={Roles.ADMIN}>{i18n.t("team.admin")}</option>
                <option value={Roles.EMPLOYEE}>
                  {i18n.t("team.employee")}
                </option>
                <option value={Roles.BOOK_KEEPER}>
                  {i18n.t("team.bookkeeper")}
                </option>
                <option value={Roles.CLIENT}>
                  {i18n.t("team.clientRole")}
                </option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowInviteDialog(false)}
            >
              {i18n.t("cancel")}
            </Button>
            <Button
              onClick={() => inviteMutation.mutate(memberForm)}
              disabled={!memberFormComplete || inviteMutation.isPending}
            >
              {i18n.t("team.inviteMember")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showEditDialog}
        onOpenChange={handleDialogClose(setShowEditDialog)}
      >
        <DialogContent className="border-border bg-card text-foreground sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{i18n.t("team.editMember")}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {i18n.t("team.teamOverview")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="edit-member-first-name"
                className="text-sm font-medium text-foreground"
              >
                {i18n.t("contacts.firstName")}
              </label>
              <input
                id="edit-member-first-name"
                name="firstName"
                value={memberForm.firstName}
                onChange={handleMemberFormChange("firstName")}
                className="flex h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="edit-member-last-name"
                className="text-sm font-medium text-foreground"
              >
                {i18n.t("contacts.lastName")}
              </label>
              <input
                id="edit-member-last-name"
                name="lastName"
                value={memberForm.lastName}
                onChange={handleMemberFormChange("lastName")}
                className="flex h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label
                htmlFor="edit-member-email"
                className="text-sm font-medium text-foreground"
              >
                {i18n.t("email")}
              </label>
              <input
                id="edit-member-email"
                name="email"
                type="email"
                value={memberForm.email}
                onChange={handleMemberFormChange("email")}
                className="flex h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label
                htmlFor="edit-member-role"
                className="text-sm font-medium text-foreground"
              >
                {i18n.t("role")}
              </label>
              <select
                id="edit-member-role"
                name="role"
                value={memberForm.role}
                onChange={handleMemberFormChange("role")}
                className="flex h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value={Roles.ADMIN}>{i18n.t("team.admin")}</option>
                <option value={Roles.EMPLOYEE}>
                  {i18n.t("team.employee")}
                </option>
                <option value={Roles.BOOK_KEEPER}>
                  {i18n.t("team.bookkeeper")}
                </option>
                <option value={Roles.CLIENT}>
                  {i18n.t("team.clientRole")}
                </option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              {i18n.t("cancel")}
            </Button>
            <Button
              onClick={() => editMutation.mutate(memberForm)}
              disabled={!memberFormComplete || editMutation.isPending}
            >
              {i18n.t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamTable;
