import React from "react";

import { useUserContext } from "context/UserContext";
import { minToHHMM } from "helpers";
import { DeleteIcon, DotsThreeVerticalIcon, EditIcon } from "miruIcons";
import { useNavigate } from "react-router-dom";
import { Badge, MobileMoreOptions } from "StyledComponents";

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
    if (isAdminUser) {
      setGrayColor("bg-miru-gray-100");
    }
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
        className={`cursor-pointer last:border-b-0 ${grayColor}`}
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
        <td className="table__cell hidden px-3 py-3 text-center lg:table-cell">
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
              <EditIcon color="#5B34EA" size={16} />
            </button>
          )}
        </td>
        <td className="table__cell hidden px-3 py-3 text-center lg:table-cell">
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
          {isAdminUser && (
            <DotsThreeVerticalIcon
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
        <MobileMoreOptions
          setVisibilty={setShowMoreOptions}
          visibilty={showMoreOptions}
        >
          <li
            className="flex items-center pt-3 text-sm leading-5 text-miru-han-purple-1000"
            onClick={() => {
              setShowMoreOptions(false);
              setEditProjectData({ id, name, clientName, isBillable });
              setShowProjectModal(true);
            }}
          >
            <EditIcon className="mr-4" color="#5B34EA" size={16} />
            Edit
          </li>
          <li
            className="flex items-center pt-3 text-sm leading-5 text-miru-red-400"
            onClick={() => {
              setShowMoreOptions(false);
              setShowDeleteDialog(true);
              setDeleteProjectData({ id, name });
            }}
          >
            <DeleteIcon className="mr-4" size={16} />
            Delete
          </li>
        </MobileMoreOptions>
      )}
    </>
  );
};
