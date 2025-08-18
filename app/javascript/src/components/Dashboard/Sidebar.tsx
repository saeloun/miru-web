import React from "react";
import { cn } from "../../lib/utils";
import { Link, useLocation } from "react-router-dom";
import { CaretRight } from "phosphor-react";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export interface NavigationItem {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: string | number;
  children?: NavigationItem[];
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
    name: string;
    email: string;
    avatar?: string;
  };
}

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
              className={cn(
                "transition-transform",
                isExpanded && "rotate-90"
              )}
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
            </TooltipTrigger>
            <TooltipContent side="right">
              {item.label}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
        {navigationGroups ? (
          navigationGroups.map((group, groupIndex) => (
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
        ) : navigation ? (
          navigation.map((item, index) => (
            <SidebarItem
              key={`${item.href}-${index}`}
              item={item}
              isCollapsed={isCollapsed}
            />
          ))
        ) : null}
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
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-medium text-primary">
                  {user.name
                    .split(" ")
                    .map(n => n[0])
                    .join("")
                    .slice(0, 2)}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-primary">
                  {user.name
                    .split(" ")
                    .map(n => n[0])
                    .join("")
                    .slice(0, 2)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  {user.name}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {user.email}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Sidebar;