import React from "react";
import { i18n } from "../../i18n";
import { useMediaQuery } from "../../hooks/use-media-query";

interface ResponsiveTeamProps {
  children?: React.ReactNode;
  [key: string]: any;
}

// Responsive team member card
export const ResponsiveTeamMemberCard: React.FC<any> = props => {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-xl font-semibold text-foreground">
            {props.avatar ? (
              <img
                src={props.avatar}
                alt={props.name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span>{props.initials}</span>
            )}
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-semibold">{props.name}</h3>
            <p className="text-sm text-muted-foreground">{props.role}</p>
            <p className="mt-1 text-sm text-muted-foreground">{props.email}</p>

            <div className="mt-3 flex gap-4">
              <div>
                <p className="text-xs uppercase text-muted-foreground">
                  {i18n.t("department")}
                </p>
                <p className="text-sm font-medium">{props.department}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">
                  {i18n.t("active")}
                </p>
                <p className="text-sm">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                      props.isActive
                        ? "border border-border bg-card text-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {props.isActive ? i18n.t("active") : i18n.t("inactive")}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {props.onEdit && (
              <button
                onClick={props.onEdit}
                className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
            )}
            {props.onDelete && (
              <button
                onClick={props.onDelete}
                className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {props.projects && props.projects.length > 0 && (
          <div className="mt-4 border-t border-border pt-4">
            <p className="mb-2 text-xs uppercase text-muted-foreground">
              {i18n.t("team.currentProjects")}
            </p>
            <div className="flex flex-wrap gap-2">
              {props.projects.map((project, index) => (
                <span
                  key={index}
                  className="rounded bg-accent px-2 py-1 text-xs text-accent-foreground"
                >
                  {project}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Mobile view
  return (
    <div className="border-b border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted font-semibold text-foreground">
          {props.avatar ? (
            <img
              src={props.avatar}
              alt={props.name}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <span>{props.initials}</span>
          )}
        </div>

        <div className="flex-1">
          <h3 className="font-semibold">{props.name}</h3>
          <p className="text-sm text-muted-foreground">{props.role}</p>
          <p className="text-xs text-muted-foreground">{props.email}</p>
        </div>

        <span
          className={`rounded-full px-2 py-1 text-xs ${
            props.isActive
              ? "border border-border bg-card text-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {props.isActive ? i18n.t("active") : i18n.t("inactive")}
        </span>
      </div>

      {props.projects && props.projects.length > 0 && (
        <div className="mt-3 border-t border-border pt-3">
          <div className="flex flex-wrap gap-1">
            {props.projects.slice(0, 3).map((project, index) => (
              <span
                key={index}
                className="rounded bg-accent px-2 py-1 text-xs text-accent-foreground"
              >
                {project}
              </span>
            ))}
            {props.projects.length > 3 && (
              <span className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                {i18n.t("team.nMore", { count: props.projects.length - 3 })}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Responsive team stats card
export const ResponsiveTeamStats: React.FC<any> = props => {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">{i18n.t("team.teamOverview")}</h3>
        <div className="grid grid-cols-4 gap-6">
          <div>
            <p className="text-2xl font-bold">{props.totalMembers}</p>
            <p className="text-sm text-muted-foreground">{i18n.t("team.totalMembers")}</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {props.activeMembers}
            </p>
            <p className="text-sm text-muted-foreground">{i18n.t("active")}</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">
              {props.totalProjects}
            </p>
            <p className="text-sm text-muted-foreground">{i18n.t("projects")}</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {props.totalHours}h
            </p>
            <p className="text-sm text-muted-foreground">{i18n.t("thisMonth")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-border bg-card p-4">
      <h3 className="font-semibold mb-3">{i18n.t("team.teamOverview")}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-xl font-bold">{props.totalMembers}</p>
          <p className="text-xs text-muted-foreground">{i18n.t("team.totalMembers")}</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-foreground">
            {props.activeMembers}
          </p>
          <p className="text-xs text-muted-foreground">{i18n.t("active")}</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-primary">
            {props.totalProjects}
          </p>
          <p className="text-xs text-muted-foreground">{i18n.t("projects")}</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-foreground">
            {props.totalHours}h
          </p>
          <p className="text-xs text-muted-foreground">{i18n.t("thisMonth")}</p>
        </div>
      </div>
    </div>
  );
};

// Main responsive team component
export const ResponsiveTeam: React.FC<ResponsiveTeamProps> = ({
  children,
  ...props
}) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <div className={isDesktop ? "container mx-auto px-4 py-6" : "pb-16"}>
      {children}
    </div>
  );
};

export default ResponsiveTeam;
