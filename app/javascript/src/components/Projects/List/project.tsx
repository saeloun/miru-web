import React from "react";

import { minToHHMM } from "helpers";
import { PenIcon, DeleteIcon } from "miruIcons";
import { DotsThreeVertical } from "phosphor-react";
import { useNavigate } from "react-router-dom";
import { Badge, MobileMoreOptions } from "StyledComponents";

import { useUserContext } from "context/UserContext";

import { IProject } from "../interface";

export const Project = ({
  id,
  name,
  clientName,
  minutesSpent,
  isBillable,
  isAdminUser,
  setShowProjectModal,
  setEditProjectData,
  setShowDeleteDialog,
  setDeleteProjectData,
}: IProject) => {
  const [grayColor, setGrayColor] = React.useState<string>("");
  const [isHover, setIsHover] = React.useState<boolean>(false);
  const [showMoreOptions, setShowMoreOptions] = React.useState<boolean>(false);
  const navigate = useNavigate();
  const { isDesktop } = useUserContext();
  const handleMouseEnter = () => {
    setGrayColor("bg-miru-gray-100");
    setIsHover(true);
  };

  const handleMouseLeave = () => {
    setGrayColor("");
    setIsHover(false);
  };

  const projectClickHandler = id => {
    navigate(`${id}`);
  };

  return (
    <>
      <tr
        className={`last:border-b-0 ${grayColor}`}
        key={id}
        onClick={() => isAdminUser && projectClickHandler(id)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave} // eslint-disable-line
      >
        <td className="table__cell text-base capitalize">
          <div className="flex items-center justify-between text-sm font-semibold text-miru-dark-purple-1000 lg:text-base">
            {name}
          </div>
          <p className="max-h-32 overflow-auto whitespace-pre-wrap break-words text-xs font-medium text-miru-dark-purple-400 lg:text-sm">
            {clientName}
          </p>
        </td>
        {isDesktop && (
          <td className="table__cell text-right">
            {isBillable && (
              <Badge
                bgColor="bg-miru-han-purple-100"
                className="rounded-lg px-1 capitalize tracking-widest"
                color="text-miru-han-purple-1000"
                text="billable"
              />
            )}
          </td>
        )}
        <td className="table__cell text-right text-lg font-bold lg:text-xl">
          {minToHHMM(minutesSpent)}
        </td>
        <td className="table__cell hidden px-3 py-3 lg:inline">
          {isAdminUser && isHover && (
            <button
              id="editProject"
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                setShowProjectModal(true);
                setEditProjectData({ id, name, clientName, isBillable });
              }}
            >
              <PenIcon color="#5B34EA" size={16} />
            </button>
          )}
        </td>
        <td className="table__cell hidden px-3 py-3 lg:inline">
          {isAdminUser && isHover && (
            <button
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                setShowDeleteDialog(true);
                setDeleteProjectData({ id, name });
              }}
            >
              <DeleteIcon color="#5B34EA" size={16} />
            </button>
          )}
        </td>
        <td className="table__cell table-cell items-center px-3 py-3 lg:hidden">
          {isDesktop ? (
            isAdminUser &&
            isHover && (
              <button
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowDeleteDialog(true);
                  setDeleteProjectData({ id, name });
                }}
              >
                <DeleteIcon color="#5B34EA" size={16} />
              </button>
            )
          ) : (
            <DotsThreeVertical
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
            className="flex items-center px-2 pt-3 text-sm leading-5 text-miru-dark-purple-1000"
            onClick={() => {
              setShowMoreOptions(false);
              setEditProjectData({ id, name, clientName, isBillable });
              setShowProjectModal(true);
            }}
          >
            Edit
          </li>
          <li
            className="flex items-center px-2 pt-3 text-sm leading-5 text-miru-dark-purple-1000"
            onClick={() => {
              setShowMoreOptions(false);
              setShowDeleteDialog(true);
              setDeleteProjectData({ id, name });
            }}
          >
            Delete
          </li>
        </MobileMoreOptions>
      )}
    </>
  );
};
