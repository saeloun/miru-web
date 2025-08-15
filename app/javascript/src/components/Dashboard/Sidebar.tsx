import React from "react";
import { cn } from "../../lib/utils";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Badge } from "../ui/badge";
import { useTheme } from "contexts/ThemeContext";

export interface NavigationItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  children?: NavigationItem[];
  roles?: string[];
  isActive?: boolean;
}

interface SidebarProps {
  navigation: NavigationItem[];
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

  const handleClick = (e: React.MouseEvent) => {
    if (hasChildren && !isCollapsed) {
      e.preventDefault();
      setIsExpanded(!isExpanded);
    }
  };

  const ItemContent = () => (
    <>
      <item.icon
        className={cn("h-5 w-5 flex-shrink-0", isActive && "text-primary")}
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
            <ChevronRight
              className={cn(
                "h-4 w-4 transition-transform",
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
          title={isCollapsed ? item.label : undefined}
        >
          <ItemContent />
        </Link>
      )}

      {/* Child items */}
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
  navigation,
  isCollapsed,
  className,
  logo,
  user,
}) => {
  const { effectiveTheme } = useTheme();

  return (
    <div className={cn("flex h-full w-full flex-col bg-card", className)}>
      {/* Logo */}
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

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {navigation.map((item, index) => (
          <SidebarItem
            key={`${item.href}-${index}`}
            item={item}
            isCollapsed={isCollapsed}
          />
        ))}
      </nav>

      {/* User info */}
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
