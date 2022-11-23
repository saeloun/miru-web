import React, { Fragment } from "react";

import { TeamModalType } from "constants/index";

import { EditIcon, ArchiveIcon } from "miruIcons";
import { useNavigate } from "react-router-dom";

import { useList } from "context/TeamContext";
import { useUserContext } from "context/UserContext";

const TableRow = ({ item }) => {
  const { isAdminUser, user } = useUserContext();
  const { setModalState } = useList();
  const navigate = useNavigate();

  const isAllowUser = isAdminUser || (item.status && !!user['team_lead'])
  const actionIconVisible = isAllowUser && item.role !== "owner";

  const handleAction = (e,action) => {
    e.preventDefault();
    e.stopPropagation();
    setModalState(action, item);
  };

  return (
    <tr data-cy="team-table-row" className="border-b last:border-0 border-miru-gray-200 hoverIcon" onClick={() => {
      navigate("1");
    }}>
      <td className="table__data p-6 capitalize">
        {item.name}
      </td>
      <td className="table__data table__text p-6">
        {item.email}
      </td>
      <td className="table__data table__text p-6 capitalize">
        {item.role}
      </td>
      <td className="table__data table__text p-6">
        {item.department && item.department.name}
      </td>
      <td className="table__data table__text text-center">
        { item.teamLead && <span style={{ fontSize: "150%", fontWeight: "bold", color: "green" }}>&#10004;</span>}
      </td>
      {isAllowUser &&
        <Fragment>
          <td className="pr-6 py-6 text-right w-48">
            {
              item.status && <span className="table__pending">
                Pending Invitation
              </span>
            }
          </td>
          <td className="pr-6 py-6 text-right w-44">
            {actionIconVisible && (
              <div className="invisible iconWrapper">
                <button data-cy="edit-team-member-button" className="ml-12" onClick={(e) => handleAction(e, TeamModalType.ADD_EDIT)} title='Edit'>
                  <EditIcon size={16} className="text-col-han-app-1000" weight="bold" />
                </button>
                <button data-cy="delete-team-member-button" className="ml-12" onClick={(e) => handleAction(e, TeamModalType.DELETE)} title='Archive'>
                  <ArchiveIcon size={16} className="text-col-han-app-1000" weight="bold" />
                </button>
              </div>)}
          </td>
        </Fragment>
      }
    </tr>
  );
};

export default TableRow;
