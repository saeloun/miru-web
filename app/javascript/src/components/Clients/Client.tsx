import * as React from "react";
import clients from "apis/clients";

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
  setClientToEdit
}: IClient) => {
  const deleteClient = async id => {
    await clients.deleteClient(id);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };
  return (
    <tr key={id}>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-miru-dark-purple-1000">
        {name}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-miru-dark-purple-1000">
        {email}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right font-black">
        {hoursLogged}
      </td>
      {isAdminUser && (
        <>
          <td className="px-2 py-4 whitespace-nowrap text-right text-sm font-medium">
            <button
              onClick={() => {
                setShowEditDialog(true);
                setClientToEdit({ id, name, email, phone, address });
              }}
            >
              <img src={editIcon} alt="" />
            </button>
          </td>
          <td className="px-2 py-4 whitespace-nowrap text-right text-sm font-medium">
            <button onClick={() => deleteClient(id)}>
              <img src={deleteIcon} alt="" />
            </button>
          </td>
        </>
      )}
    </tr>
  );
};
