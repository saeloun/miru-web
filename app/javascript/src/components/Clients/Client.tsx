import React, { useState } from "react";
import { minutesToHHMM } from "../../helpers/hhmm-parser";

export interface IClient {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  minutes_spent: number;
  editIcon: string;
  deleteIcon: string;
  isAdminUser: boolean;
  setShowEditDialog: any;
  setClientToEdit: any;
  setClientToDelete: any;
  setShowDeleteDialog: any;
}

export const Client = ({
  id,
  name,
  email,
  phone,
  address,
  minutes_spent,
  editIcon,
  deleteIcon,
  isAdminUser,
  setShowEditDialog,
  setClientToEdit,
  setClientToDelete,
  setShowDeleteDialog
}: IClient) => {
  const [grayColor, setGrayColor] = useState<string>("");
  const [isHover, setHover] = useState<boolean>(false);

  const handleMouseEnter = () => {
    setGrayColor("bg-miru-gray-100");
    setHover(true);
  };

  const handleMouseLeave = () => {
    setGrayColor("");
    setHover(false);
  };

  return (
    <tr key={id} className={`last:border-b-0 ${grayColor}`} onMouseLeave={handleMouseLeave} onMouseEnter={handleMouseEnter}>
      <td className="table__cell text-base">
        {name}
      </td>
      <td className="table__cell text-xs">
        {email}
      </td>
      <td className="table__cell text-xl text-right font-bold">
        {minutesToHHMM(minutes_spent)}
      </td>
      <td className="table__cell px-3 py-3">
        {isAdminUser && isHover && <button
          onClick={() => {
            setShowEditDialog(true);
            setClientToEdit({ id, name, email, phone, address });
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
            setClientToDelete({ id, name });
          }}
        >
          <img src={deleteIcon} alt="" />
        </button>
        }
      </td>
    </tr>
  );
};
