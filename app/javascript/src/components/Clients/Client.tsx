import * as React from "react";

export interface IClient {
  id: number;
  name: string;
  email: string;
  hoursLogged: string;
  editIcon: string;
  deleteIcon: string;
  isAdminUser: boolean;
}

const Client = ({
  id,
  name,
  email,
  hoursLogged,
  editIcon,
  deleteIcon,
  isAdminUser
}: IClient) => (
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
          <button>
            <img src={editIcon} alt="" />
          </button>
        </td>
        <td className="px-2 py-4 whitespace-nowrap text-right text-sm font-medium">
          <button>
            <img src={deleteIcon} alt="" />
          </button>
        </td>
      </>
    )}
  </tr>
);

export default Client;
