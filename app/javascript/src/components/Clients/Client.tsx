import * as React from "react";

export interface IClient {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  hoursLogged: string;
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
  hoursLogged,
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
      <td className="px-6 py-6 whitespace-nowrap text-sm font-medium text-miru-dark-purple-1000">
        {name}
      </td>
      <td className="px-6 py-6 whitespace-nowrap text-sm font-medium text-miru-dark-purple-1000">
        {email}
      </td>
      <td className="px-6 py-6 whitespace-nowrap text-right font-black">
        {hoursLogged}
      </td>
      <td className="px-2 py-4 whitespace-nowrap text-right text-sm font-medium">
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
      <td className="px-2 py-4 whitespace-nowrap text-right text-sm font-medium">
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
