import React from "react";

import EmptyStates from "common/EmptyStates";
import Table from "common/Table";
import { useUserContext } from "context/UserContext";
import { PlusIcon } from "miruIcons";

import TableData from "./TableData";

import {
  employeeTableHeader,
  mobileEmployeeTableHeader,
  mobileTableHeader,
  tableHeader,
} from "../constants";

const ClientList = ({
  clientData,
  handleTooltip,
  showToolTip,
  toolTipRef,
  setShowMoreOptions,
  setClientId,
  handleDeleteClick,
  handleEditClick,
  handleRowClick,
  setShowDialog,
  setIsClient,
}) => {
  const { isAdminUser, isDesktop } = useUserContext();

  const getTableData = TableData(
    clientData,
    handleTooltip,
    showToolTip,
    toolTipRef,
    isDesktop,
    isAdminUser,
    setShowMoreOptions,
    setClientId
  );

  return (
    <div className="mx-auto flex w-full flex-col lg:px-4">
      <div>
        <div className="mx-auto inline-block min-w-full py-2 align-middle">
          <div className="overflow-hidden">
            {clientData && clientData.length > 0 ? (
              <Table
                handleDeleteClick={handleDeleteClick}
                handleEditClick={handleEditClick}
                hasRowIcons={isAdminUser}
                rowOnClick={isAdminUser ? handleRowClick : () => {}}
                tableRowArray={getTableData}
                tableHeader={
                  isAdminUser && isDesktop
                    ? tableHeader
                    : isAdminUser && !isDesktop
                    ? mobileTableHeader
                    : !isAdminUser && isDesktop
                    ? employeeTableHeader
                    : mobileEmployeeTableHeader
                }
              />
            ) : (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientList;
