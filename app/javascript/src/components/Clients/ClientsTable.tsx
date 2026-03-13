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
import { clientsApi } from "apis/api";
import { unmapClientList } from "../../mapper/mappedIndex";
import { toast } from "sonner";
import ClientForm from "./ClientForm";
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

const fetchClients = async (timeFrame = "week"): Promise<ClientsData> => {
  try {
    const res = await clientsApi.get(`?time_frame=${timeFrame}`);

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
  const [timeFrame, setTimeFrame] = useState("week");
  const [showNewClientDialog, setShowNewClientDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editClientData, setEditClientData] = useState<any>(null);
  const [clientLogo, setClientLogo] = useState<any>(null);
  const [clientLogoUrl, setClientLogoUrl] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingClient, setLoadingClient] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["clients", timeFrame],
    queryFn: () => fetchClients(timeFrame),
  });

  const deleteMutation = useMutation({
    mutationFn: async (clientId: string) => {
      await clientsApi.destroy(clientId);
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

  const handleEdit = async (client: Client) => {
    setSelectedClient(client);
    setLoadingClient(true);
    setSubmitting(false); // Reset submitting state when opening
    setClientLogo(null);
    setClientLogoUrl("");
    setShowEditDialog(true);
    try {
      // Fetch full client details including address
      const response = await clientsApi.show(client.id, "");
      const fullClientData = response.data.client_details;
      setEditClientData(fullClientData);
      setClientLogoUrl(fullClientData?.logo || "");
    } catch (error) {
      console.error("Failed to fetch client details:", error);
      toast.error("Failed to load client details");
    } finally {
      setLoadingClient(false);
    }
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
          CLIENT
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
            <p className="font-medium text-foreground">{client.name}</p>
            <p className="text-sm text-muted-foreground">{client.email}</p>
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
            {client.phone || <span className="text-muted-foreground">—</span>}
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
          HOURS LOGGED
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
          <Timer size={16} className="text-muted-foreground" />
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
                className="text-destructive focus:text-destructive"
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
    return <Loader className="h-96" />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Warning size={48} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Failed to load clients</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground md:text-base">
            Manage your client relationships and billing
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            id="timeFrame"
            value={timeFrame}
            onChange={event => setTimeFrame(event.target.value)}
            className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="week">This Week</option>
            <option value="last_week">Last Week</option>
            <option value="month">This Month</option>
            <option value="last_month">Last Month</option>
          </select>
          {isAdminUser && (
            <Button
              onClick={() => {
                setSubmitting(false);
                setClientLogo(null);
                setClientLogoUrl("");
                setShowNewClientDialog(true);
              }}
            >
              <Plus size={20} className="mr-2" />
              Add Client
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Buildings size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.clientList?.length || 0}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Active clients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours Tracked</CardTitle>
            <Timer size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.totalMinutes ? formatHours(data.totalMinutes) : "0h 0m"}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Total tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">OUTSTANDING</CardTitle>
            <CurrencyDollar size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currencyFormat(
                baseCurrency,
                data?.overdueOutstandingAmount?.outstanding || 0
              )}
            </div>
            {data?.overdueOutstandingAmount?.overdue > 0 && (
              <p className="mt-1 text-xs text-destructive">
                {currencyFormat(
                  baseCurrency,
                  data.overdueOutstandingAmount.overdue
                )}{" "}
                OVERDUE
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
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
              <Buildings
                size={48}
                className="mx-auto mb-4 text-muted-foreground/70"
              />
              <p className="mb-4 text-muted-foreground">
                Looks like there aren't any clients added yet.
              </p>
              {isAdminUser && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSubmitting(false);
                    setClientLogo(null);
                    setClientLogoUrl("");
                    setShowNewClientDialog(true);
                  }}
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

      {/* New Client Dialog */}
      <Dialog
        open={showNewClientDialog}
        onOpenChange={open => {
          setShowNewClientDialog(open);
          if (!open) {
            setClientLogo(null);
            setClientLogoUrl("");
            setSubmitting(false);
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>
              Fill in the details below to add a new client.
            </DialogDescription>
          </DialogHeader>
          <ClientForm
            clientLogoUrl={clientLogoUrl}
            handleDeleteLogo={() => {
              setClientLogo(null);
              setClientLogoUrl("");
            }}
            setClientLogoUrl={setClientLogoUrl}
            setClientLogo={setClientLogo}
            clientData={data?.clientList || []}
            formType="new"
            setClientData={newData => {
              queryClient.invalidateQueries({ queryKey: ["clients"] });
            }}
            setnewClient={value => {
              setShowNewClientDialog(value);
              if (!value) {
                refetch();
              }
            }}
            clientLogo={clientLogo}
            submitting={submitting}
            setSubmitting={setSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog
        open={showEditDialog}
        onOpenChange={open => {
          setShowEditDialog(open);
          if (!open) {
            setSelectedClient(null);
            setEditClientData(null);
            setClientLogo(null);
            setClientLogoUrl("");
            setSubmitting(false);
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Update the client details below.
            </DialogDescription>
          </DialogHeader>
          {loadingClient ? (
            <div className="flex items-center justify-center py-8">
              <Loader size="sm" overlay={false} className="min-h-0 py-0" />
            </div>
          ) : editClientData ? (
            <ClientForm
              key={editClientData.id}
              client={editClientData}
              clientLogoUrl={clientLogoUrl}
              handleDeleteLogo={() => {
                setClientLogo(null);
                setClientLogoUrl("");
              }}
              setClientLogoUrl={setClientLogoUrl}
              setClientLogo={setClientLogo}
              formType="edit"
              setShowEditDialog={setShowEditDialog}
              clientLogo={clientLogo}
              submitting={submitting}
              setSubmitting={setSubmitting}
              fetchDetails={() => {
                refetch();
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientsTable;
