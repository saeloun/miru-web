import * as React from "react";

import { minToHHMM } from "helpers";
import { PenIcon, DeleteIcon } from "miruIcons";
import { useNavigate } from "react-router-dom";
import { Badge } from "StyledComponents";

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
  const [isHover, setHover] = React.useState<boolean>(false);
  const navigate = useNavigate();

  const handleMouseEnter = () => {
    setGrayColor("bg-miru-gray-100");
    setHover(true);
  };

  const handleMouseLeave = () => {
    setGrayColor("");
    setHover(false);
  };

  const projectClickHandler = id => {
    navigate(`${id}`);
  };

  return (
    <tr
      className={`last:border-b-0 ${grayColor}`}
      key={id}
      onClick={() => isAdminUser && projectClickHandler(id)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave} // eslint-disable-line
    >
      <td className="table__cell text-base">
        <div className="flex items-center justify-between">{name}</div>
        <p className="max-h-32 overflow-auto whitespace-pre-wrap break-words text-sm text-miru-dark-purple-400">
          {clientName}
        </p>
      </td>
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
      <td className="table__cell text-right text-xl font-bold">
        {minToHHMM(minutesSpent)}
      </td>
      <td className="table__cell px-3 py-3">
        {isAdminUser && isHover && (
          <button
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
      <td className="table__cell px-3 py-3">
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
    </tr>
  );
};
