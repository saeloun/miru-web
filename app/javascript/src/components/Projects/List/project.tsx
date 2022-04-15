import * as React from "react";
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
  projectClickHandler,
  setShowProjectModal,
  setEditProjectData
}: IProject) => {
  const [grayColor, setGrayColor] = React.useState<string>("");
  const [isHover, setHover] = React.useState<boolean>(false);

  const handleMouseEnter = () => {
    setGrayColor("bg-miru-gray-100");
    setHover(true);
  };

  const handleMouseLeave = () => {
    setGrayColor("");
    setHover(false);
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
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowProjectModal(true);
            setEditProjectData({ id,name,clientName,isBillable });
          }}
        >
          <Pen size={16} color="#5B34EA" />
        </button>
        }
      </td>
      <td className="table__cell px-3 py-3">
        {isAdminUser && isHover && <button>
          <Trash size={16} color="#5B34EA" />
        </button>
        }
      </td>
    </tr>
  );
};
