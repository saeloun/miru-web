import React, { Fragment } from "react";

import { EditIcon, DeleteIcon, DotsThreeVerticalIcon } from "miruIcons";
import { useNavigate } from "react-router-dom";
import { Badge, MobileMoreOptions } from "StyledComponents";

import { TeamModalType } from "constants/index";
import { useList } from "context/TeamContext";
import { useUserContext } from "context/UserContext";

const TableRow = ({ item }) => {
  const { isAdminUser, isDesktop } = useUserContext();
  const { setModalState } = useList();
  const navigate = useNavigate();

  const [showMoreOptions, setShowMoreOptions] = React.useState<boolean>(false);
  const { id, name, email, role, status } = item;

  const actionIconVisible = isAdminUser && role !== "owner";

  const handleAction = (e, action) => {
    e.preventDefault();
    e.stopPropagation();
    setModalState(action, item);
  };

  const handleRowClick = () => {
    if (status) return;

    if (isDesktop) {
      isAdminUser ? navigate(`/team/${id}`, { replace: true }) : null;
    } else {
      isAdminUser ? navigate(`/team/${id}/options`, { replace: true }) : null;
    }
  };

  if (isDesktop) {
    return (
      <tr
        className={`hoverIcon ${
          isAdminUser && "cursor-pointer"
        } border-b border-miru-gray-200 last:border-0`}
        onClick={handleRowClick}
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
                <Badge
                  bgColor="bg-miru-han-purple-100"
                  className="rounded-lg px-1 capitalize tracking-widest"
                  color="text-miru-han-purple-1000"
                  text="Pending Invitation"
                />
              )}
            </td>
            <td className="w-44 py-6 pr-6 text-right">
              {actionIconVisible && (
                <div className="iconWrapper invisible">
                  <button
                    className="ml-12"
                    id="editMember"
                    onClick={e => handleAction(e, TeamModalType.ADD_EDIT)}
                  >
                    <EditIcon color="#5b34ea" size={16} weight="bold" />
                  </button>
                  <button
                    className="ml-12"
                    id="deleteMember"
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
  }

  return (
    <>
      <tr
        className="border-b border-miru-gray-200 last:border-0"
        onClick={handleRowClick}
      >
        <td className="table__data p-6">
          <dl className="flex items-center justify-between text-sm font-semibold capitalize text-miru-dark-purple-1000">
            <dt>{name}</dt>
          </dl>
          <dl className="max-h-32 overflow-auto whitespace-pre-wrap break-words text-xs font-medium text-miru-dark-purple-400">
            <dt>{email}</dt>
          </dl>
        </td>
        <td className="table__data table__text p-6 text-right text-sm font-medium capitalize">
          {role}
          {status && (
            <dl className="mt-3 max-h-32 overflow-auto whitespace-pre-wrap break-words">
              <Badge
                bgColor="bg-miru-han-purple-100"
                className="rounded-lg px-1 capitalize tracking-widest"
                color="text-miru-han-purple-1000"
                text="Pending"
              />
            </dl>
          )}
        </td>
        <td className="table__data table__cell items-center px-3 py-3 lg:hidden">
          {actionIconVisible && (
            <DotsThreeVerticalIcon
              className="w-full"
              size={16}
              weight="bold"
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                setShowMoreOptions(true);
              }}
            />
          )}
        </td>
      </tr>
      {showMoreOptions && (
        <MobileMoreOptions setVisibilty={setShowMoreOptions}>
          <li
            className="flex items-center px-2 pt-3 text-sm leading-5 text-miru-han-purple-1000"
            onClick={e => handleAction(e, TeamModalType.ADD_EDIT)}
          >
            <EditIcon className="mr-4" color="#5B34EA" size={16} />
            Edit
          </li>
          <li
            className="flex items-center px-2 pt-3 text-sm leading-5 text-miru-red-400"
            onClick={e => handleAction(e, TeamModalType.DELETE)}
          >
            <DeleteIcon className="mr-4" size={16} />
            Delete
          </li>
        </MobileMoreOptions>
      )}
    </>
  );
};

export default TableRow;
