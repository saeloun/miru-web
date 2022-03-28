import * as React from "react";
import { minutesToHHMM } from "helpers/hhmm-parser";

export interface IMember {
  id: number;
  name: string;
  hourly_rate: number;
  minutes_logged: number;
  editIcon: string;
  deleteIcon: string;
  isAdminUser: boolean;
  setShowEditDialog: any;
  setMemberToEdit: any;
  setMemberToDelete: any;
  setShowDeleteDialog: any;
}

export const Member = ({
  id,
  name,
  hourly_rate,
  minutes_logged,
  editIcon,
  deleteIcon,
  isAdminUser,
  setShowEditDialog,
  setMemberToEdit,
  setMemberToDelete,
  setShowDeleteDialog
}: IMember) => {
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
      onMouseEnter={handleMouseEnter}>
      <td className="table__cell text-base">
        {name}
      </td>
      <td className="table__cell text-xs">
        {hourly_rate}
      </td>
      <td className="table__cell text-xl text-right font-bold">
        {minutesToHHMM(minutes_logged)}
      </td>
      <td className="table__cell text-xl text-right font-bold">
        {minutes_logged * hourly_rate}
      </td>
      <td className="table__cell px-3 py-3">
        {isAdminUser && isHover && <button
          onClick={() => {
            setShowEditDialog(true);
            setMemberToEdit({ id, name, hourly_rate });
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
            setMemberToDelete({ id, name });
          }}
        >
          <img src={deleteIcon} alt="" />
        </button>
        }
      </td>
    </tr>
  );
};
