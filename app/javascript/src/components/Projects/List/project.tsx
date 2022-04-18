import * as React from "react";
import { minutesToHHMM } from "helpers/hhmm-parser";
import { Pen, Trash } from "phosphor-react";
import { IProject } from "../interface";

export const Project = ({
  id,
  name,
  client,
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
        {name}
      </td>
      <td className="table__cell text-right">
        {isBillable && <span className="px-1 tracking-widest rounded-lg text-xs font-semibold leading-4 bg-miru-han-purple-100 text-miru-han-purple-1000">Billable</span>}
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
            setEditProjectData({ id,name,client,isBillable });
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
