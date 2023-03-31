import React, { Fragment } from "react";

import { EditIcon, DeleteIcon } from "miruIcons";
import { useNavigate } from "react-router-dom";

import { TeamModalType } from "constants/index";
import { useList } from "context/TeamContext";
import { useUserContext } from "context/UserContext";

const TableRow = ({ item }) => {
  const { isAdminUser, isDesktop } = useUserContext();
  const { setModalState } = useList();
  const navigate = useNavigate();

  const { id, name, email, role, status } = item;

  const actionIconVisible = isAdminUser && role !== "owner";

  const handleAction = (e, action) => {
    e.preventDefault();
    e.stopPropagation();
    setModalState(action, item);
  };

  return (
    <tr
      className={`hoverIcon ${
        isAdminUser && "cursor-pointer"
      } border-b border-miru-gray-200 last:border-0`}
      onClick={() => {
        if (status) return;

        if (isDesktop) {
          isAdminUser ? navigate(`/team/${id}`, { replace: true }) : null;
        } else {
          isAdminUser
            ? navigate(`/team/${id}/options`, { replace: true })
            : null;
        }
      }}
    >
      <td className="table__data p-6 capitalize">{name}</td>
      <td className="table__data table__text p-6 text-sm font-medium">
        {email}
      </td>
      <td className="table__data table__text p-6 text-sm font-medium capitalize">
        {role}
      </td>
      {isAdminUser && (
        <Fragment>
          <td className="w-48 py-6 pr-6 text-right">
            {status && (
              <span className="table__pending">Pending Invitation</span>
            )}
          </td>
          <td className="w-44 py-6 pr-6 text-right">
            {actionIconVisible && (
              <div className="iconWrapper invisible">
                <button
                  className="ml-12"
                  onClick={e => handleAction(e, TeamModalType.ADD_EDIT)}
                >
                  <EditIcon color="#5b34ea" size={16} weight="bold" />
                </button>
                <button
                  className="ml-12"
                  onClick={e => handleAction(e, TeamModalType.DELETE)}
                >
                  <DeleteIcon color="#5b34ea" size={16} weight="bold" />
                </button>
              </div>
            )}
          </td>
        </Fragment>
      )}
    </tr>
  );
};

export default TableRow;
