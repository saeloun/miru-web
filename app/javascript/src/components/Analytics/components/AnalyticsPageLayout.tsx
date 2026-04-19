import React from "react";
import { Link, useLocation } from "react-router-dom";

import { Paths } from "../../../constants";
import { Button } from "../../ui/button";

const analyticsNavItems = [
  { label: "Dashboard", href: Paths.ANALYTICS },
  { label: "Revenue Forecast", href: `${Paths.ANALYTICS}/revenue-forecast` },
  { label: "Team Analytics", href: `${Paths.ANALYTICS}/team` },
  { label: "Client Insights", href: `${Paths.ANALYTICS}/clients` },
  { label: "Expense Trends", href: `${Paths.ANALYTICS}/expenses` },
];

type AnalyticsPageLayoutProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
};

const AnalyticsPageLayout: React.FC<AnalyticsPageLayoutProps> = ({
  title,
  description,
  children,
  filters,
  actions,
}) => {
  const location = useLocation();

  return (
    <div className="w-full space-y-6 p-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link className="hover:text-foreground" to={Paths.ANALYTICS}>
              Analytics
            </Link>
            {location.pathname !== Paths.ANALYTICS && (
              <>
                <span>/</span>
                <span>{title}</span>
              </>
            )}
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
          {actions}
        </div>

        <div className="flex flex-wrap gap-2">
          {analyticsNavItems.map(item => (
            <Button
              key={item.href}
              asChild
              variant={location.pathname === item.href ? "default" : "outline"}
            >
              <Link to={item.href}>{item.label}</Link>
            </Button>
          ))}
        </div>
      </div>

      {filters}

      {children}
    </div>
  );
};

export default AnalyticsPageLayout;
