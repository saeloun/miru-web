import React from "react";
import { useNavigate } from "react-router-dom";

import { minToHHMM } from "helpers";
import { PlusIcon, DotsThreeVerticalIcon } from "miruIcons";
import { useUserContext } from "context/UserContext";
import EmptyStates from "common/EmptyStates";
import { Avatar } from "StyledComponents";

// Color palette for clients - generates consistent colors based on client name
const generateClientColor = (name: string) => {
  const colors = [
    "bg-blue-50 border-blue-200",
    "bg-green-50 border-green-200",
    "bg-purple-50 border-purple-200",
    "bg-yellow-50 border-yellow-200",
    "bg-pink-50 border-pink-200",
    "bg-indigo-50 border-indigo-200",
    "bg-red-50 border-red-200",
    "bg-teal-50 border-teal-200",
    "bg-orange-50 border-orange-200",
    "bg-cyan-50 border-cyan-200",
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
          Message="Looks like there aren't any clients added yet."
          messageClassName="w-full lg:mt-5"
          showNoSearchResultState={false}
          wrapperClassName="mt-5"
        >
          <button
            className="mt-4 mb-10 flex h-10 flex-row items-center justify-center rounded bg-miru-han-purple-1000 px-25 font-bold text-white"
            type="button"
            onClick={() => {
              setShowDialog(true);
              setIsClient(true);
            }}
          >
            <PlusIcon size={20} weight="bold" />
            <span className="ml-2 inline-block text-xl">Add Clients</span>
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
                    isAdminUser ? "hover:border-miru-han-purple-600" : ""
                  }`}
                  onClick={() => handleRowClick(client.id)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <Avatar classNameImg="h-12 w-12" url={client.logo} />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {typeof client.name === "string"
                            ? client.name
                            : "Client"}
                        </h3>
                        <p className="text-sm text-gray-600">Client</p>
                      </div>
                    </div>
                    {isAdminUser && (
                      <div className="relative">
                        <button
                          className="p-1 hover:bg-gray-100 rounded"
                          onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            // Simple toggle for now - you can enhance this with proper dropdown later
                          }}
                        >
                          <DotsThreeVerticalIcon
                            className="h-5 w-5 text-gray-500"
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
                      <span className="text-sm font-medium text-gray-600">
                        Hours Logged:
                      </span>
                      <span className="text-lg font-bold text-miru-han-purple-1000">
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
                        <h3 className="text-base font-semibold text-gray-900 truncate">
                          {typeof client.name === "string"
                            ? client.name
                            : "Client"}
                        </h3>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <span className="font-medium">
                            {minToHHMM(client.minutes || 0)} hrs
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-miru-han-purple-1000 bg-miru-han-purple-100 px-2 py-1 rounded">
                        {minToHHMM(client.minutes || 0)}
                      </span>
                      {isAdminUser && (
                        <DotsThreeVerticalIcon
                          className="h-5 w-5 text-gray-500"
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
