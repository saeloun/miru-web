import React from "react";
import { useNavigate } from "react-router-dom";

import { minToHHMM } from "helpers";
import { PlusIcon, DotsThreeVerticalIcon } from "miruIcons";
import { useUserContext } from "context/UserContext";
import EmptyStates from "common/EmptyStates";
import { Avatar } from "StyledComponents";
import { i18n } from "../../../i18n";

// Color palette for clients - generates consistent colors based on client name
const generateClientColor = (name: string) => {
  const colors = [
    "bg-card border-border",
    "bg-muted/30 border-border",
    "bg-card border-border",
    "bg-muted/30 border-border",
    "bg-card border-border",
    "bg-muted/30 border-border",
    "bg-card border-border",
    "bg-muted/30 border-border",
    "bg-card border-border",
    "bg-muted/30 border-border",
  ];

  // Generate consistent index based on client name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

const ModernClientList = ({
  clientData,
  handleDeleteClick,
  handleEditClick,
  setShowDialog,
  setIsClient,
}) => {
  const { isAdminUser, isDesktop } = useUserContext();
  const navigate = useNavigate();

  const handleRowClick = (id: number) => {
    if (isAdminUser) {
      navigate(`/clients/${id}`);
    }
  };

  if (!clientData || clientData.length === 0) {
    return (
      <div className="mx-auto flex w-full flex-col px-4">
        <EmptyStates
          Message={i18n.t("clients.noClientsYet")}
          messageClassName="w-full lg:mt-5"
          showNoSearchResultState={false}
          wrapperClassName="mt-5"
        >
          <button
            className="mt-4 mb-10 flex h-10 flex-row items-center justify-center rounded bg-primary px-25 font-bold text-white"
            type="button"
            onClick={() => {
              setShowDialog(true);
              setIsClient(true);
            }}
          >
            <PlusIcon size={20} weight="bold" />
            <span className="ml-2 inline-block text-xl">{i18n.t("clients.addClients")}</span>
          </button>
        </EmptyStates>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full flex-col px-4">
      <div className="space-y-4">
        {isDesktop ? (
          // Desktop Grid Layout
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clientData.map(client => {
              const colorClass = generateClientColor(client.name);

              return (
                <div
                  key={client.id}
                  className={`cursor-pointer rounded-lg border-2 ${colorClass} p-6 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
                    isAdminUser ? "hover:border-primary" : ""
                  }`}
                  onClick={() => handleRowClick(client.id)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <Avatar classNameImg="h-12 w-12" url={client.logo} />
                      <div className="flex-1 min-w-0">
                        <h3 className="truncate text-lg font-semibold text-foreground">
                          {typeof client.name === "string"
                            ? client.name
                            : i18n.t("client")}
                        </h3>
                        <p className="text-sm text-muted-foreground">{i18n.t("client")}</p>
                      </div>
                    </div>
                    {isAdminUser && (
                      <div className="relative">
                        <button
                          className="rounded p-1 hover:bg-muted"
                          onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            // Simple toggle for now - you can enhance this with proper dropdown later
                          }}
                        >
                          <DotsThreeVerticalIcon
                            className="h-5 w-5 text-muted-foreground"
                            onClick={e => {
                              e.preventDefault();
                              e.stopPropagation();
                              // For now, just trigger edit on click
                              handleEditClick(client.id);
                            }}
                          />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        {i18n.t("clients.hoursTracked")}:
                      </span>
                      <span className="text-lg font-bold text-primary">
                        {minToHHMM(client.minutes || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Mobile List Layout
          <div className="space-y-3">
            {clientData.map(client => {
              const colorClass = generateClientColor(client.name);

              return (
                <div
                  key={client.id}
                  className={`cursor-pointer rounded-lg border ${colorClass} p-4 transition-all duration-200 hover:shadow-md`}
                  onClick={() => handleRowClick(client.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <Avatar classNameImg="h-10 w-10" url={client.logo} />
                      <div className="flex-1 min-w-0">
                        <h3 className="truncate text-base font-semibold text-foreground">
                          {typeof client.name === "string"
                            ? client.name
                            : i18n.t("client")}
                        </h3>
                        <div className="mt-1 flex items-center text-sm text-muted-foreground">
                          <span className="font-medium">
                            {minToHHMM(client.minutes || 0)} {i18n.t("hours")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-primary bg-accent px-2 py-1 rounded">
                        {minToHHMM(client.minutes || 0)}
                      </span>
                      {isAdminUser && (
                        <DotsThreeVerticalIcon
                          className="h-5 w-5 text-muted-foreground"
                          onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEditClick(client.id);
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernClientList;
