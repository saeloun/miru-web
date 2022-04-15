import * as React from "react";
import { useNavigate } from "react-router-dom";
import { minutesToHHMM } from "helpers/hhmm-parser";
import { Pen, Trash } from "phosphor-react";
import { IProject } from "../interface";

export const Project = ({
  id,
  name,
  clientName,
  minutesSpent,
  isBillable,
  isAdminUser,
  setProjectToDelete,
  setShowDeleteDialog,
  setShowProjectModal,
  setEditProjectId
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
  const projectClickHandler = (id) => {
    navigate(`${id}`);
  };
  return (
    <tr key={id}
      className={`last:border-b-0 ${grayColor}`}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      onClick={() => projectClickHandler(id)}>
      <td className="table__cell text-base">
        {name}"  "{clientName}
      </td>
      <td className="table__cell text-xs">
        {isBillable}
      </td>
      <td className="table__cell text-xl text-right font-bold">
        {minutesToHHMM(minutesSpent)}
      </td>
      <td className="table__cell px-3 py-3">
        {isAdminUser && isHover && <button
          onClick={() => {
            setShowProjectModal(true);
            setEditProjectId(id);
          }}
        >
          <Pen size={16} color="#5B34EA" />
        </button>
        }
      </td>
      <td className="table__cell px-3 py-3">
        {isAdminUser && isHover && <button
          onClick={() => {
            setShowDeleteDialog(true);
            setProjectToDelete({ id, name });
          }}>
          <Trash size={16} color="#5B34EA" />
        </button>
        }
      </td>
    </tr>
  );
};
