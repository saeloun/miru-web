import React from "react";
import { i18n } from "../../i18n";
import { cn } from "../../lib/utils";
import { Link, useLocation } from "react-router-dom";
import { Buildings, CaretRight, Check, CaretDown } from "phosphor-react";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { getDisplayAvatarUrl } from "../../helpers";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { WorkspaceApi } from "apis/api";

export interface NavigationItem {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: string | number;
  children?: NavigationItem[];
  external?: boolean;
  roles?: string[];
  isActive?: boolean;
}

export interface NavigationGroup {
  title: string;
  items: NavigationItem[];
}

interface SidebarProps {
  navigationGroups?: NavigationGroup[];
  navigation?: NavigationItem[];
  isCollapsed?: boolean;
  className?: string;
  logo?: React.ReactNode;
  user?: {
    id?: number;
    name: string;
    email: string;
    avatar?: string;
    currentWorkspaceId?: number;
  };
}

const userInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map(part => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const SidebarItem: React.FC<{
  item: NavigationItem;
  isCollapsed?: boolean;
  level?: number;
}> = ({ item, isCollapsed, level = 0 }) => {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = React.useState(false);

  const isActive = item.isActive ?? location.pathname === item.href;
  const hasChildren = item.children && item.children.length > 0;
  const Icon = item.icon;

  const handleClick = (e: React.MouseEvent) => {
    if (hasChildren && !isCollapsed) {
      e.preventDefault();
      setIsExpanded(!isExpanded);
    }
  };

  const ItemContent = () => (
    <>
      <Icon
        className={cn("flex-shrink-0", isActive && "text-primary")}
        size={20}
        weight={isActive ? "fill" : "regular"}
      />
      {!isCollapsed && (
        <>
          <span
            className={cn(
              "flex-1 truncate",
              isActive && "text-primary font-medium"
            )}
          >
            {item.label}
          </span>
          {item.badge && (
            <Badge variant="secondary" className="ml-auto">
              {item.badge}
            </Badge>
          )}
          {hasChildren && (
            <CaretRight
              size={16}
              weight="light"
              className={cn("transition-transform", isExpanded && "rotate-90")}
            />
          )}
        </>
      )}
    </>
  );

  return (
    <div>
      {hasChildren && !isCollapsed ? (
        <button
          onClick={handleClick}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
            level > 0 && "ml-4",
            isActive
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
        >
          <ItemContent />
        </button>
      ) : isCollapsed ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {item.external ? (
                <a
                  href={item.href}
                  className={cn(
                    "flex items-center justify-center py-2 text-sm rounded-lg transition-colors",
                    "w-10 h-10 mx-auto",
                    level > 0 && "ml-4",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <ItemContent />
                </a>
              ) : (
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center justify-center py-2 text-sm rounded-lg transition-colors",
                    "w-10 h-10 mx-auto",
                    level > 0 && "ml-4",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <ItemContent />
                </Link>
              )}
            </TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : item.external ? (
        <a
          href={item.href}
          className={cn(
            "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
            level > 0 && "ml-4",
            isActive
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
          rel="noopener noreferrer"
          target="_blank"
        >
          <ItemContent />
        </a>
      ) : (
        <Link
          to={item.href}
          className={cn(
            "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
            level > 0 && "ml-4",
            isActive
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
        >
          <ItemContent />
        </Link>
      )}

      {hasChildren && isExpanded && !isCollapsed && (
        <div className="mt-1 space-y-1">
          {item.children?.map((child, index) => (
            <SidebarItem
              key={`${child.href}-${index}`}
              item={child}
              isCollapsed={isCollapsed}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({
  navigationGroups,
  navigation,
  isCollapsed,
  className,
  logo,
  user,
}) => {
  const displayAvatarUrl = getDisplayAvatarUrl(user?.avatar, user?.email, 64);
  const [workspaces, setWorkspaces] = React.useState<any[]>([]);
  const [isWorkspaceDialogOpen, setIsWorkspaceDialogOpen] =
    React.useState(false);

  const [isSwitchingWorkspaceId, setIsSwitchingWorkspaceId] = React.useState<
    number | null
  >(null);

  React.useEffect(() => {
    if (!user) return;

    const fetchWorkspaces = async () => {
      const response = await WorkspaceApi.get();
      setWorkspaces(response.data.workspaces || []);
    };

    fetchWorkspaces();
  }, [user?.id, user?.currentWorkspaceId]);

  const currentWorkspace = React.useMemo(
    () =>
      workspaces.find(workspace => workspace.id === user?.currentWorkspaceId) ||
      null,
    [workspaces, user?.currentWorkspaceId]
  );

  const handleWorkspaceSwitch = async (workspaceId: number) => {
    setIsSwitchingWorkspaceId(workspaceId);
    await WorkspaceApi.update(workspaceId);
    window.location.reload();
  };

  return (
    <div className={cn("flex h-full w-full flex-col bg-card", className)}>
      {logo && (
        <div
          className={cn(
            "flex items-center p-4 border-b border-border",
            isCollapsed && "justify-center"
          )}
        >
          {logo}
        </div>
      )}

      <nav className="flex-1 space-y-4 p-4 overflow-y-auto">
        {navigationGroups
          ? navigationGroups.map((group, groupIndex) => (
              <div key={`group-${groupIndex}`}>
                {!isCollapsed && group.title && (
                  <h3 className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {group.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {group.items.map((item, index) => (
                    <SidebarItem
                      key={`${item.href}-${index}`}
                      item={item}
                      isCollapsed={isCollapsed}
                    />
                  ))}
                </div>
                {groupIndex < navigationGroups.length - 1 && (
                  <Separator className="my-4" />
                )}
              </div>
            ))
          : navigation
          ? navigation.map((item, index) => (
              <SidebarItem
                key={`${item.href}-${index}`}
                item={item}
                isCollapsed={isCollapsed}
              />
            ))
          : null}
      </nav>

      {user && (
        <div
          className={cn(
            "border-t border-border p-4",
            isCollapsed && "text-center"
          )}
        >
          {isCollapsed ? (
            <div className="flex justify-center">
              <Avatar className="h-8 w-8">
                <AvatarImage src={displayAvatarUrl} alt={user.name} />
                <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                  {userInitials(user.name)}
                </AvatarFallback>
              </Avatar>
            </div>
          ) : (
            <>
              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg text-left transition-colors",
                  workspaces.length > 1 && "hover:bg-accent p-2 -m-2"
                )}
                disabled={workspaces.length <= 1}
                onClick={() => setIsWorkspaceDialogOpen(true)}
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={displayAvatarUrl} alt={user.name} />
                  <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                    {userInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {user.name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </div>
                  {currentWorkspace && (
                    <div className="mt-0.5 text-[11px] text-muted-foreground truncate">
                      {currentWorkspace.name}
                    </div>
                  )}
                </div>
                {workspaces.length > 1 && (
                  <CaretDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                )}
              </button>
              <Dialog
                open={isWorkspaceDialogOpen}
                onOpenChange={setIsWorkspaceDialogOpen}
              >
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {i18n.t("navbar.switchWorkspace")}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2">
                    {workspaces.map(workspace => {
                      const isCurrent =
                        workspace.id === user.currentWorkspaceId;

                      const isSwitching =
                        workspace.id === isSwitchingWorkspaceId;

                      return (
                        <Button
                          key={workspace.id}
                          variant={isCurrent ? "secondary" : "outline"}
                          className="h-auto w-full justify-between px-4 py-3"
                          disabled={
                            isCurrent || Boolean(isSwitchingWorkspaceId)
                          }
                          onClick={() => handleWorkspaceSwitch(workspace.id)}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                              <Buildings className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0 text-left">
                              <div className="truncate text-sm font-medium">
                                {workspace.name}
                              </div>
                            </div>
                          </div>
                          {isCurrent ? (
                            <Check className="h-4 w-4 flex-shrink-0" />
                          ) : isSwitching ? (
                            <span className="text-xs opacity-70">...</span>
                          ) : null}
                        </Button>
                      );
                    })}
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
