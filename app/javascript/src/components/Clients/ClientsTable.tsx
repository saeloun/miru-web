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
} from "../ui/dialog";
import {
  Plus,
  DotsThree,
  PencilSimple,
  Trash,
  Buildings,
  Timer,
  CurrencyDollar,
  Warning,
  CaretUp,
  CaretDown,
  ArrowUp,
  ArrowDown,
} from "phosphor-react";
import { currencyFormat } from "../../helpers/currency";
import { useUserContext } from "../../context/UserContext";
import { clientsApi } from "../../services/api";
import { unmapClientList } from "../../mapper/mappedIndex";
import { toast } from "sonner";

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  logo?: string;
  minutes: number;
  currency?: string;
}

interface ClientsData {
  clientList: Client[];
  totalMinutes: number;
  overdueOutstandingAmount: {
    overdue: number;
    outstanding: number;
  };
}

const fetchClients = async (): Promise<ClientsData> => {
  try {
    const res = await clientsApi.list();

    // unmapClientList expects { data: response } structure
    return unmapClientList({ data: res.data });
  } catch (error) {
    console.warn("Clients API error, using fallback data", error);

    return {
      clientList: [],
      totalMinutes: 0,
      overdueOutstandingAmount: {
        overdue: 0,
        outstanding: 0,
      },
    };
  }
};

const ClientsTable: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdminUser, company } = useUserContext();
  const [showNewClientDialog, setShowNewClientDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["clients"],
    queryFn: () => fetchClients(),
  });

  const deleteMutation = useMutation({
    mutationFn: async (clientId: string) => {
      await clientsApi.delete(clientId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client deleted successfully");
      setShowDeleteDialog(false);
    },
    onError: () => {
      toast.error("Failed to delete client");
    },
  });

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setShowEditDialog(true);
  };

  const handleDelete = (client: Client) => {
    setSelectedClient(client);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (selectedClient) {
      deleteMutation.mutate(selectedClient.id);
    }
  };

  const formatHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return `${hours}h ${mins}m`;
  };

  const baseCurrency = company?.baseCurrency || "USD";

  const columns: ColumnDef<Client>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Client
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
        const client = row.original;

        return (
          <div>
            <p className="font-medium text-gray-900">{client.name}</p>
            <p className="text-sm text-gray-500">{client.email}</p>
          </div>
        );
      },
    },
    {
      accessorKey: "phone",
      header: "Contact",
      cell: ({ row }) => {
        const client = row.original;

        return (
          <div className="text-sm">
            {client.phone || <span className="text-gray-400">—</span>}
          </div>
        );
      },
    },
    {
      accessorKey: "minutes",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Hours Tracked
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
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Timer size={16} className="text-gray-400" />
          <span className="text-sm">
            {formatHours(row.original.minutes || 0)}
          </span>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => <Badge variant="outline">Active</Badge>,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const client = row.original;

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
                onClick={() => navigator.clipboard.writeText(client.id)}
              >
                Copy client ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => navigate(`/clients/${client.id}`)}
              >
                View details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(client)}>
                <PencilSimple size={16} className="mr-2" />
                Edit client
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(client)}
                className="text-red-600"
              >
                <Trash size={16} className="mr-2" />
                Delete client
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
          <p className="text-gray-600">Failed to load clients</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-1">
            Manage your client relationships and billing
          </p>
        </div>
        {isAdminUser && (
          <Button
            onClick={() => setShowNewClientDialog(true)}
            className="bg-gray-900 hover:bg-gray-800 text-white"
          >
            <Plus size={20} className="mr-2" />
            Add Client
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Buildings size={20} className="text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.clientList?.length || 0}
            </div>
            <p className="text-xs text-gray-600 mt-1">Active clients</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours Tracked</CardTitle>
            <Timer size={20} className="text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.totalMinutes ? formatHours(data.totalMinutes) : "0h 0m"}
            </div>
            <p className="text-xs text-gray-600 mt-1">Total tracked</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <CurrencyDollar size={20} className="text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currencyFormat(
                baseCurrency,
                data?.overdueOutstandingAmount?.outstanding || 0
              )}
            </div>
            {data?.overdueOutstandingAmount?.overdue > 0 && (
              <p className="text-xs text-red-600 mt-1">
                {currencyFormat(
                  baseCurrency,
                  data.overdueOutstandingAmount.overdue
                )}{" "}
                overdue
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
          <CardDescription>
            A list of all your clients with their contact information and
            billing status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data?.clientList && data.clientList.length > 0 ? (
            <DataTable
              columns={columns}
              data={data.clientList}
              searchPlaceholder="Search clients..."
            />
          ) : (
            <div className="text-center py-12">
              <Buildings size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600 mb-4">No clients added yet</p>
              {isAdminUser && (
                <Button
                  variant="outline"
                  onClick={() => setShowNewClientDialog(true)}
                >
                  <Plus size={20} className="mr-2" />
                  Add Your First Client
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
            <DialogTitle>Delete Client</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedClient?.name}? This
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
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientsTable;
