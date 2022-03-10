import * as React from "react";

export interface IClient {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  hours_spend: number;
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
  hours_spend,
  editIcon,
  deleteIcon,
  isAdminUser,
  setShowEditDialog,
  setClientToEdit,
  setClientToDelete,
  setShowDeleteDialog
}: IClient) => {
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
    <tr key={id} className={`last:border-b-0 ${grayColor}`} onMouseLeave={handleMouseLeave} onMouseEnter={handleMouseEnter}>
      <td className="table__cell text-base">
        {name}
      </td>
      <td className="table__cell text-xs">
        {email}
      </td>
      <td className="table__cell text-xl text-right font-bold">
        {hours_spend}
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
