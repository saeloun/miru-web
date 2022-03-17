import * as React from "react";
import { minutesToHHMM } from "../../helpers/hhmm-parser";

export interface IProject {
  id: number;
  name: string;
  clientName: string;
  isBillable: boolean;
  minutesSpent: number;
  editIcon: string;
  deleteIcon: string;
  isAdminUser: boolean;
  setShowEditDialog: any;
  setProjectToEdit: any;
  setProjectToDelete: any;
  setShowDeleteDialog: any;
  projectClickHandler: any;
}

export const Project = ({
  id,
  name,
  clientName,
  minutesSpent,
  isBillable,
  editIcon,
  deleteIcon,
  isAdminUser,
  projectClickHandler,
  setShowEditDialog,
  setProjectToEdit,
  setProjectToDelete,
  setShowDeleteDialog
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
          onClick={() => {
            setShowEditDialog(true);
            setProjectToEdit({ id, name, isBillable });
          }}
        >
          <img src={editIcon} alt="" />
        </button>
        }
      </td>
      <td className="table__cell px-3 py-3">
        { isAdminUser && isHover && <button
          onClick={() => {
            setShowDeleteDialog(true);
            setProjectToDelete({ id, name });
          }}
        >
          <img src={deleteIcon} alt="" />
        </button>
        }
      </td>
    </tr>
  );
};
