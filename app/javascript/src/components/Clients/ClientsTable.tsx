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
  CopySimple,
  Eye,
} from "phosphor-react";
import { currencyFormat } from "../../helpers/currency";
import { useUserContext } from "../../context/UserContext";
import { clientsApi } from "apis/api";
import { unmapClientList } from "../../mapper/mappedIndex";
import { toast } from "sonner";
import { i18n } from "../../i18n";
import ClientEditor from "./ClientForm/ClientEditor";
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
      toast.success(i18n.t("clients.clientDeletedSuccessfully"));
      setShowDeleteDialog(false);
    },
    onError: () => {
      toast.error(i18n.t("clients.failedToDeleteClient"));
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
      toast.error(i18n.t("clients.failedToLoadClientDetails"));
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
          {i18n.t("clients.clientHeader")}
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
      header: i18n.t("clients.contact"),
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
          {i18n.t("clients.hoursLogged")}
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
      header: i18n.t("status"),
      cell: ({ row }) => <Badge variant="outline">{i18n.t("active")}</Badge>,
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
                <span className="sr-only">{i18n.t("openMenu")}</span>
                <DotsThree size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(client.id)}
              >
                <CopySimple size={16} className="mr-2" />
                {i18n.t("clients.copyClientId")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate(`/clients/${client.id}`)}
              >
                <Eye size={16} className="mr-2" />
                {i18n.t("clients.viewDetails")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(client)}>
                <PencilSimple size={16} className="mr-2" />
                {i18n.t("clients.editClient")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDelete(client)}
                className="text-destructive focus:text-destructive"
              >
                <Trash size={16} className="mr-2" />
                {i18n.t("clients.deleteClient")}
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
          <p className="text-muted-foreground">
            {i18n.t("clients.failedToLoadClients")}
          </p>
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
            {i18n.t("clients.manageClientsDescription")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            id="timeFrame"
            value={timeFrame}
            onChange={event => setTimeFrame(event.target.value)}
            className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="week">{i18n.t("thisWeek")}</option>
            <option value="last_week">{i18n.t("lastWeek")}</option>
            <option value="month">{i18n.t("thisMonth")}</option>
            <option value="last_month">{i18n.t("lastMonth")}</option>
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
              {i18n.t("clients.addNewClient")}
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {i18n.t("clients.totalClients")}
            </CardTitle>
            <Buildings size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.clientList?.length || 0}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {i18n.t("clients.activeClients")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {i18n.t("clients.hoursTracked")}
            </CardTitle>
            <Timer size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.totalMinutes ? formatHours(data.totalMinutes) : "0h 0m"}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {i18n.t("clients.totalTracked")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {i18n.t("clients.outstanding")}
            </CardTitle>
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
                {i18n.t("clients.overdue")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>{i18n.t("clients.allClients")}</CardTitle>
          <CardDescription>
            {i18n.t("clients.allClientsDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data?.clientList && data.clientList.length > 0 ? (
            <DataTable
              columns={columns}
              data={data.clientList}
              searchPlaceholder={i18n.t("searchClients")}
            />
          ) : (
            <div className="text-center py-12">
              <Buildings
                size={48}
                className="mx-auto mb-4 text-muted-foreground/70"
              />
              <p className="mb-4 text-muted-foreground">
                {i18n.t("clients.noClientsYet")}
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
                  {i18n.t("clients.addYourFirstClient")}
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
            <DialogTitle>{i18n.t("clients.deleteClient")}</DialogTitle>
            <DialogDescription>
              {i18n.t("clients.deleteClientConfirm", {
                name: selectedClient?.name,
              })}
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
                ? i18n.t("clients.deleting")
                : i18n.t("delete")}
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
            <DialogTitle>{i18n.t("clients.addNewClient")}</DialogTitle>
            <DialogDescription>
              {i18n.t("clients.addNewClientDescription")}
            </DialogDescription>
          </DialogHeader>
          <ClientEditor
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
            <DialogTitle>{i18n.t("clients.editClient")}</DialogTitle>
            <DialogDescription>
              {i18n.t("clients.editClientDescription")}
            </DialogDescription>
          </DialogHeader>
          {loadingClient ? (
            <div className="flex items-center justify-center py-8">
              <Loader size="sm" overlay={false} className="min-h-0 py-0" />
            </div>
          ) : editClientData ? (
            <ClientEditor
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
