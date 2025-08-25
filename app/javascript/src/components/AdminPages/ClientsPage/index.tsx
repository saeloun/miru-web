import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import {
  Users,
  MagnifyingGlass,
  Plus,
  Funnel,
  DotsThree,
  Envelope,
  CurrencyDollar,
  FileText,
  Calendar,
  Buildings,
  ArrowUpRight,
  Star,
  Warning,
  CheckCircle,
} from "phosphor-react";
import { cn } from "../../../lib/utils";
import { currencyFormat } from "../../../helpers/currency";

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  avatar?: string;
  status: "active" | "inactive" | "pending";
  totalRevenue: number;
  outstandingAmount: number;
  projectsCount: number;
  lastActivity: string;
  joinedDate: string;
  isVip?: boolean;
  currency: string;
}

interface ClientsPageProps {
  clients?: Client[];
  className?: string;
}

const ClientsPage: React.FC<ClientsPageProps> = ({
  clients = [],
  className,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Mock data for demonstration
  const mockClients: Client[] =
    clients.length > 0
      ? clients
      : [
          {
            id: "1",
            name: "Sarah Johnson",
            email: "sarah@acmecorp.com",
            phone: "+1 (555) 123-4567",
            company: "Acme Corporation",
            address: "123 Business St, San Francisco, CA",
            avatar: undefined,
            status: "active",
            totalRevenue: 45000,
            outstandingAmount: 8500,
            projectsCount: 3,
            lastActivity: "2 hours ago",
            joinedDate: "2023-01-15",
            isVip: true,
            currency: "USD",
          },
          {
            id: "2",
            name: "Michael Chen",
            email: "m.chen@techstart.io",
            phone: "+1 (555) 987-6543",
            company: "TechStart Inc",
            address: "456 Innovation Ave, Austin, TX",
            avatar: undefined,
            status: "active",
            totalRevenue: 32000,
            outstandingAmount: 0,
            projectsCount: 2,
            lastActivity: "1 day ago",
            joinedDate: "2023-03-22",
            isVip: false,
            currency: "USD",
          },
          {
            id: "3",
            name: "Emily Rodriguez",
            email: "emily@designstudio.com",
            company: "Creative Design Studio",
            status: "pending",
            totalRevenue: 15000,
            outstandingAmount: 3200,
            projectsCount: 1,
            lastActivity: "1 week ago",
            joinedDate: "2023-11-08",
            isVip: false,
            currency: "USD",
          },
        ];

  const statusOptions = [
    { value: "all", label: "All Clients", count: mockClients.length },
    {
      value: "active",
      label: "Active",
      count: mockClients.filter(c => c.status === "active").length,
    },
    {
      value: "pending",
      label: "Pending",
      count: mockClients.filter(c => c.status === "pending").length,
    },
    {
      value: "inactive",
      label: "Inactive",
      count: mockClients.filter(c => c.status === "inactive").length,
    },
  ];

  const filteredClients = mockClients.filter(client => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      selectedStatus === "all" || client.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      active: {
        color: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle,
      },
      pending: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: Warning,
      },
      inactive: {
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: Warning,
      },
    };

    const variant = variants[status] || variants.inactive;
    const Icon = variant.icon;

    return (
      <Badge
        className={cn("capitalize flex items-center gap-1", variant.color)}
      >
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);


  const handleClientClick = (clientId: string) => {
    navigate(`/clients/${clientId}`);
  };

  const totalStats = {
    totalRevenue: mockClients.reduce(
      (sum, client) => sum + client.totalRevenue,
      0
    ),
    outstanding: mockClients.reduce(
      (sum, client) => sum + client.outstandingAmount,
      0
    ),
    activeClients: mockClients.filter(c => c.status === "active").length,
    vipClients: mockClients.filter(c => c.isVip).length,
  };

  return (
    <div
      className={cn(
        "min-h-screen bg-gray-50/50 dark:bg-gray-900/50",
        className
      )}
    >
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-[#5B34EA]/10 rounded-lg">
                <Users className="h-6 w-6 text-[#5B34EA]" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  Clients
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Manage your client relationships and projects
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* MagnifyingGlass */}
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search Clients..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5B34EA] focus:border-transparent bg-white dark:bg-gray-800 dark:text-gray-100"
                />
              </div>

              <Button variant="outline" size="sm">
                <Funnel className="mr-2 h-4 w-4" />
                Funnel
              </Button>

              <Button className="bg-[#5B34EA] hover:bg-[#4926D1]" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Client
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Total Revenue
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {currencyFormat("USD", totalStats.totalRevenue)}
                  </p>
                </div>
                <CurrencyDollar className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Outstanding
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {currencyFormat("USD", totalStats.outstanding)}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Active Clients
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {totalStats.activeClients}
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    VIP Clients
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {totalStats.vipClients}
                  </p>
                </div>
                <Star className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Funnel Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
          {statusOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setSelectedStatus(option.value)}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                selectedStatus === option.value
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              )}
            >
              {option.label} ({option.count})
            </button>
          ))}
        </div>

        {/* Clients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map(client => (
            <Card
              key={client.id}
              className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-[#5B34EA]/30"
              onClick={() => handleClientClick(client.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={client.avatar} alt={client.name} />
                      <AvatarFallback className="bg-[#5B34EA]/10 text-[#5B34EA] font-medium">
                        {getInitials(client.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#5B34EA] transition-colors">
                          {client.name}
                        </h3>
                        {client.isVip && (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {client.company}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(client.status)}
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <DotsThree className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">
                      Total Revenue
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {currencyFormat(client.currency, client.totalRevenue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">
                      Outstanding
                    </p>
                    <p
                      className={cn(
                        "font-semibold",
                        client.outstandingAmount > 0
                          ? "text-orange-600 dark:text-orange-400"
                          : "text-green-600 dark:text-green-400"
                      )}
                    >
                      {currencyFormat(
                        client.currency,
                        client.outstandingAmount
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <Buildings className="w-4 h-4" />
                    <span>{client.projectsCount} projects</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>{client.lastActivity}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Envelope className="w-3 h-3" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-[#5B34EA] transition-colors ml-auto" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {searchQuery ? "No clients found" : "No clients yet"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              {searchQuery
                ? "Try adjusting your search query to find the clients you're looking for"
                : "Start building your client base by adding your first client"}
            </p>
            {!searchQuery && (
              <Button className="mt-4 bg-[#5B34EA] hover:bg-[#4926D1]">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Client
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientsPage;
