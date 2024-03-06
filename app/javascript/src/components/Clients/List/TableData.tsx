import React from "react";

import { minToHHMM } from "helpers";
import { DotsThreeVerticalIcon } from "miruIcons";
import { Avatar, Tooltip } from "StyledComponents";

const TableData = (
  clients,
  handleTooltip,
  showTooltip,
  toolTipRef,
  isDesktop,
  isAdminUser,
  setShowMoreOptions,
  setClientId
) => {
  if (clients && isDesktop) {
    return clients.map(client => ({
      col1: (
        <Tooltip content={client.name} show={showTooltip}>
          <div className="flex">
            <Avatar classNameImg="mr-4" url={client.logo} />
            <span
              className="my-auto overflow-hidden truncate whitespace-nowrap text-base font-medium capitalize text-miru-dark-purple-1000"
              ref={toolTipRef}
              onMouseEnter={handleTooltip}
            >
              {client.name}
            </span>
          </div>
        </Tooltip>
      ),
      col2: (
        <div
          className="total-hours text-left text-sm font-medium text-miru-dark-purple-1000"
          id={`${client.id}`}
        >
          {client.email || "-"}
        </div>
      ),
      col3: (
        <div
          className="total-hours text-right text-xl font-bold text-miru-dark-purple-1000"
          id={`${client.id}`}
        >
          {minToHHMM(client.minutes)}
        </div>
      ),
      rowId: client.id,
    }));
  } else if (clients && !isDesktop) {
    return clients.map(client => ({
      col1: (
        <div className="text-base capitalize">
          <Avatar classNameImg="mr-4 w-8 h-8" url={client.logo} />
          <span
            className="my-auto overflow-hidden truncate whitespace-nowrap text-sm font-medium capitalize text-miru-dark-purple-1000"
            ref={toolTipRef}
            onMouseEnter={handleTooltip}
          >
            {client.name}
          </span>
        </div>
      ),
      col3: (
        <div
          className="total-hours text-right text-lg font-bold text-miru-dark-purple-1000"
          id={`${client.id}`}
        >
          {minToHHMM(client.minutes)}
        </div>
      ),
      col4: (
        <div>
          {isAdminUser && (
            <DotsThreeVerticalIcon
              className="mx-auto"
              height={26}
              width={24}
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                setShowMoreOptions(true);
                setClientId(client.id);
              }}
            />
          )}
        </div>
      ),
      rowId: client.id,
    }));
  }

  return [{}];
};

export default TableData;
