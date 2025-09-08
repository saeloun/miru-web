import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Clock,
  FolderOpen,
  FileText,
  BarChart3,
  CreditCard,
  Calendar,
  Receipt,
  Buildings,
  CaretLeft,
  CaretRight,
  CaretDown,
  User,
  Briefcase,
  DeviceMobile,
  Bell,
  PartyPopper,
  SignOut,
  UserCircle,
  Wallet,
  Palmtree,
  UsersRound,
} from "phosphor-react";

import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";

import { useUserContext } from "../../context/UserContext";
import { WorkspaceApi } from "apis/api";
import { MiruLogoSVG } from "miruIcons";
import { Paths, Roles } from "../../constants";

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, companyRole } = useUserContext();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [isPersonalExpanded, setIsPersonalExpanded] = useState(false);
  const [isOrgExpanded, setIsOrgExpanded] = useState(false);

  // Main navigation items with enhanced structure
  const mainNavItems = [
    {
      icon: <Clock className="h-5 w-5" />,
      label: "Time Tracking",
      path: Paths.TIME_TRACKING,
      allowedRoles: [Roles.ADMIN, Roles.OWNER, Roles.EMPLOYEE],
      badge: null,
      description: "Track time across projects",
    },
    {
      icon: <UserCircle className="h-5 w-5" />,
      label: "Clients",
      path: Paths.CLIENTS,
      allowedRoles: [Roles.ADMIN, Roles.OWNER, Roles.EMPLOYEE],
      badge: null,
      description: "Manage client relationships",
    },
    {
      icon: <FolderOpen className="h-5 w-5" />,
      label: "Projects",
      path: Paths.PROJECTS,
      allowedRoles: [Roles.ADMIN, Roles.OWNER, Roles.EMPLOYEE],
      badge: null,
      description: "Organize and track projects",
    },
    {
      icon: <FileText className="h-5 w-5" />,
      label: "Invoices",
      path: Paths.INVOICES.replace("/*", ""),
      allowedRoles: [Roles.ADMIN, Roles.OWNER, Roles.BOOK_KEEPER, Roles.CLIENT],
      badge: null,
      description: "Create and manage invoices",
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      label: "Reports",
      path: Paths.REPORTS,
      allowedRoles: [Roles.ADMIN, Roles.OWNER, Roles.BOOK_KEEPER],
      badge: null,
      description: "Analytics and insights",
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      label: "Payments",
      path: Paths.PAYMENTS,
      allowedRoles: [Roles.ADMIN, Roles.OWNER, Roles.BOOK_KEEPER],
      badge: null,
      description: "Track payment history",
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      label: "Leaves & Holidays",
      path: Paths.Leave_Management,
      allowedRoles: [Roles.ADMIN, Roles.OWNER, Roles.EMPLOYEE],
      badge: null,
      description: "Manage time off requests",
    },
    {
      icon: <Receipt className="h-5 w-5" />,
      label: "Expenses",
      path: Paths.EXPENSES,
      allowedRoles: [Roles.ADMIN, Roles.OWNER, Roles.BOOK_KEEPER],
      badge: null,
      description: "Track business expenses",
    },
  ];

  // Personal settings items
  const personalSettingsItems = [
    {
      icon: <User className="h-5 w-5" />,
      label: "Profile Settings",
      path: "/settings/profile",
      allowedRoles: [
        Roles.ADMIN,
        Roles.OWNER,
        Roles.BOOK_KEEPER,
        Roles.EMPLOYEE,
        Roles.CLIENT,
      ],
    },
    {
      icon: <Briefcase className="h-5 w-5" />,
      label: "Employment Details",
      path: "/settings/employment",
      allowedRoles: [
        Roles.ADMIN,
        Roles.OWNER,
        Roles.BOOK_KEEPER,
        Roles.EMPLOYEE,
      ],
    },
    {
      icon: <DeviceMobile className="h-5 w-5" />,
      label: "Allocated Devices",
      path: "/settings/devices",
      allowedRoles: [
        Roles.ADMIN,
        Roles.OWNER,
        Roles.BOOK_KEEPER,
        Roles.EMPLOYEE,
      ],
    },
    {
      icon: <Bell className="h-5 w-5" />,
      label: "Notification Settings",
      path: "/settings/notifications",
      allowedRoles: [
        Roles.ADMIN,
        Roles.OWNER,
        Roles.BOOK_KEEPER,
        Roles.EMPLOYEE,
      ],
    },
  ];

  // Organization settings items
  const orgSettingsItems = [
    {
      icon: <Buildings className="h-5 w-5" />,
      label: "Org. Settings",
      path: "/settings/organization",
      allowedRoles: [Roles.ADMIN, Roles.OWNER],
    },
    {
      icon: <UsersRound className="h-5 w-5" />,
      label: "Team",
      path: Paths.TEAM.replace("/*", ""),
      allowedRoles: [Roles.ADMIN, Roles.OWNER],
    },
    {
      icon: <Wallet className="h-5 w-5" />,
      label: "Payment Settings",
      path: "/settings/payment",
      allowedRoles: [Roles.ADMIN, Roles.OWNER],
    },
    {
      icon: <Palmtree className="h-5 w-5" />,
      label: "Leaves",
      path: "/settings/leaves",
      allowedRoles: [Roles.ADMIN, Roles.OWNER],
    },
    {
      icon: <PartyPopper className="h-5 w-5" />,
      label: "Holidays",
      path: "/settings/holidays",
      allowedRoles: [Roles.ADMIN, Roles.OWNER],
    },
  ];

  useEffect(() => {
    if (user) {
      fetchWorkspaces();
    }
  }, [user]);

  const fetchWorkspaces = async () => {
    try {
      const res = await WorkspaceApi.get();
      const { workspaces } = res.data;
      setWorkspaces(workspaces);
      const current = workspaces.find(w => w.id === user?.current_workspace_id);
      if (current) {
        setCurrentWorkspace(current);
      }
    } catch (error) {
      console.error("Failed to fetch workspaces:", error);
    }
  };

  const filteredMainItems = mainNavItems.filter(item =>
    item.allowedRoles.includes(companyRole)
  );

  const filteredPersonalItems = personalSettingsItems.filter(item =>
    item.allowedRoles.includes(companyRole)
  );

  const filteredOrgItems = orgSettingsItems.filter(item =>
    item.allowedRoles.includes(companyRole)
  );

  // Enhanced NavItem component with better shadcn patterns
  const NavItem = ({ item, isActive, isSubItem = false }) => {
    const content = (
      <NavLink
        to={item.path}
        className={cn(
          "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
          "hover:bg-accent hover:text-accent-foreground hover:shadow-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          isActive &&
            "bg-primary/10 text-primary shadow-sm border border-primary/20",
          isCollapsed && "justify-center px-2",
          isSubItem && !isCollapsed && "ml-2 border-l-2 border-muted pl-4"
        )}
      >
        <span
          className={cn(
            "flex-shrink-0 transition-colors",
            isActive && "text-primary",
            "group-hover:scale-105 transition-transform"
          )}
        >
          {item.icon}
        </span>
        {!isCollapsed && (
          <div className="flex-1 flex items-center justify-between min-w-0">
            <span className="truncate">{item.label}</span>
            {item.badge && (
              <Badge
                variant="secondary"
                className="ml-2 px-1.5 py-0.5 text-xs font-medium"
              >
                {item.badge}
              </Badge>
            )}
          </div>
        )}
        {isActive && !isCollapsed && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
        )}
      </NavLink>
    );

    if (isCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent
            side="right"
            className="flex flex-col gap-1.5 bg-[#5B34EA] text-white border-[#5B34EA] shadow-xl px-3 py-2"
          >
            <p className="font-semibold text-white">{item.label}</p>
            {item.description && (
              <p className="text-xs text-white/90">{item.description}</p>
            )}
            {item.badge && (
              <Badge className="self-start text-xs bg-white/20 text-white border-white/30 hover:bg-white/30">
                {item.badge}
              </Badge>
            )}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed top-0 left-0 z-30 h-full flex flex-col border-r bg-background transition-all duration-300",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo Header */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          <NavLink className="flex items-center gap-2" to={Paths.TIME_TRACKING}>
            <img
              alt="Miru"
              src={MiruLogoSVG}
              className={cn(
                "transition-all",
                isCollapsed ? "h-8 w-8" : "h-10 w-10"
              )}
            />
            {!isCollapsed && <span className="text-2xl font-bold">Miru</span>}
          </NavLink>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 p-0"
          >
            {isCollapsed ? (
              <CaretRight className="h-4 w-4" />
            ) : (
              <CaretLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
        {/* Navigation Items */}
        <ScrollArea className="flex-1 px-2 py-4">
          <nav className="space-y-6">
            {/* Main Navigation */}
            <div className="space-y-1">
              {filteredMainItems.map(item => {
                const isActive = location.pathname === item.path;

                return (
                  <NavItem key={item.path} item={item} isActive={isActive} />
                );
              })}
            </div>
            {/* Personal Settings Group */}
            {filteredPersonalItems.length > 0 && (
              <>
                {!isCollapsed && <Separator className="my-4" />}
                <Collapsible
                  open={isPersonalExpanded}
                  onOpenChange={setIsPersonalExpanded}
                  className="space-y-1"
                >
                  {!isCollapsed && (
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between px-3 py-2 h-auto font-semibold text-muted-foreground hover:text-foreground"
                      >
                        <span className="text-xs uppercase tracking-wider">
                          Personal Settings
                        </span>
                        <CaretDown
                          className={cn(
                            "h-3 w-3 transition-transform duration-200",
                            !isPersonalExpanded && "-rotate-90"
                          )}
                        />
                      </Button>
                    </CollapsibleTrigger>
                  )}
                  <CollapsibleContent className="space-y-1">
                    {filteredPersonalItems.map(item => {
                      const isActive = location.pathname === item.path;

                      return (
                        <NavItem
                          key={item.path}
                          item={item}
                          isActive={isActive}
                          isSubItem={!isCollapsed}
                        />
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              </>
            )}
            {/* Organization Settings Group */}
            {filteredOrgItems.length > 0 && (
              <>
                {!isCollapsed && <Separator className="my-4" />}
                <Collapsible
                  open={isOrgExpanded}
                  onOpenChange={setIsOrgExpanded}
                  className="space-y-1"
                >
                  {!isCollapsed && (
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between px-3 py-2 h-auto font-semibold text-muted-foreground hover:text-foreground"
                      >
                        <span className="text-xs uppercase tracking-wider">
                          Organization
                        </span>
                        <CaretDown
                          className={cn(
                            "h-3 w-3 transition-transform duration-200",
                            !isOrgExpanded && "-rotate-90"
                          )}
                        />
                      </Button>
                    </CollapsibleTrigger>
                  )}
                  <CollapsibleContent className="space-y-1">
                    {filteredOrgItems.map(item => {
                      const isActive = location.pathname === item.path;

                      return (
                        <NavItem
                          key={item.path}
                          item={item}
                          isActive={isActive}
                          isSubItem={!isCollapsed}
                        />
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              </>
            )}
          </nav>
        </ScrollArea>
        {/* Enhanced Bottom Section - Workspace Selector and Sign Out */}
        <div className="mt-auto border-t bg-muted/30">
          {currentWorkspace && (
            <div className="p-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-between gap-2 px-3 py-2.5 h-auto hover:bg-accent",
                      "focus-visible:ring-2 focus-visible:ring-primary",
                      isCollapsed && "justify-center px-2"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <Buildings className="h-4 w-4 text-primary" />
                      </div>
                      {!isCollapsed && (
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-xs text-muted-foreground">
                            Workspace
                          </p>
                          <p className="text-sm font-medium truncate">
                            {currentWorkspace.name}
                          </p>
                        </div>
                      )}
                    </div>
                    {!isCollapsed && (
                      <CaretDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align={isCollapsed ? "center" : "end"}
                  className="w-56"
                  sideOffset={5}
                >
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <Buildings className="h-4 w-4" />
                    Switch Workspace
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {workspaces.map(workspace => (
                    <DropdownMenuItem
                      key={workspace.id}
                      className={cn(
                        "cursor-pointer gap-3",
                        workspace.id === currentWorkspace.id && "bg-accent"
                      )}
                      onClick={() => {
                        // Switch workspace logic
                        // TODO: Implement workspace switching
                      }}
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10">
                        <Buildings className="h-3 w-3 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{workspace.name}</p>
                      </div>
                      {workspace.id === currentWorkspace.id && (
                        <Badge variant="secondary" className="ml-auto">
                          Active
                        </Badge>
                      )}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer">
                    <span className="text-xs text-muted-foreground">
                      Create New Workspace
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          <Separator />
          <div className="p-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size={isCollapsed ? "icon" : "default"}
                  className={cn(
                    "w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10",
                    "focus-visible:ring-2 focus-visible:ring-destructive",
                    isCollapsed && "justify-center"
                  )}
                  onClick={() => {
                    // Sign out logic
                    window.location.href = "/users/sign_out";
                  }}
                >
                  <SignOut className="h-5 w-5" />
                  {!isCollapsed && <span>Sign Out</span>}
                </Button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent
                  side="right"
                  className="bg-[#5B34EA] text-white border-[#5B34EA] shadow-xl px-3 py-2"
                >
                  <p className="font-semibold text-white">Sign Out</p>
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
};

export default Sidebar;
