import React, { Fragment } from "react";

import { TeamModalType } from "constants/index";

import { PencilSimple, Trash } from "phosphor-react";
import { useNavigate } from "react-router-dom";

import { useList } from "context/TeamContext";
import { useUserContext } from "context/UserContext";

const acceptedInvitation = require("../../../../../../assets/images/Invitation_Accepted") //eslint-disable-line
const pendingInvitation = require("../../../../../../assets/images/Invitation_Pending.svg"); //eslint-disable-line

const TableRow = ({ user }) => {
  const { isAdminUser } = useUserContext();
  const { setModalState } = useList();
  const navigate = useNavigate();

  const actionIconVisible = isAdminUser && user.role !== "owner";

  const handleAction = (e,action) => {
    e.preventDefault();
    e.stopPropagation();
    setModalState(action, user);
  };

  return (
    <tr data-cy="team-table-row" className="border-b last:border-0 border-miru-gray-200 hoverIcon" onClick={() => {
      navigate("1");
    }}>
      <td className="table__data p-6 w-3/12 font-normal text-miru-dark-purple-1000 capitalize hoverName">
        {user.name}
      </td>
      <td className="table__data w-2/6 table__text p-6">
        {user.email}
      </td>
      <td className="table__data table__text p-6 capitalize">
        {user.role}
      </td>
      {isAdminUser &&
        <Fragment>
          <td className="pr-6 py-6 text-right w-2/12">
            {user.status ? (
              <img src={pendingInvitation} className="ml-auto"/>
            ) : (
              <img src={acceptedInvitation} className="ml-auto"/>
            )}
          </td>
          <td className="pr-6 py-6 text-right w-2/12 ">
            {actionIconVisible && (
              <div className="invisible iconWrapper flex justify-around">
                <button data-cy="edit-team-member-button" className="ml-12" onClick={(e) => handleAction(e, TeamModalType.ADD_EDIT)}>
                  <PencilSimple size={16} color="#5b34ea" weight="bold" />
                </button>
                <button data-cy="delete-team-member-button" className="ml-12" onClick={(e) => handleAction(e, TeamModalType.DELETE)}>
                  <Trash size={16} color="#5b34ea" weight="bold" />
                </button>
              </div>)}
          </td>
        </Fragment>
      }
    </tr>
  );
};

export default TableRow;
