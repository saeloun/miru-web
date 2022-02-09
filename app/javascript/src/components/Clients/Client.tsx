import * as React from "react";

export interface IClient {
  id: number;
  name: string;
  email: string;
  hours_logged: string;
  editIcon: string;
  deleteIcon: string;
}

const Client = ({
  id,
  name,
  email,
  hours_logged,
  editIcon,
  deleteIcon
}: IClient) => (
  <tr key={id}>
    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-miru-dark-purple-1000">
      {name}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-miru-dark-purple-1000">
      {email}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-right font-black">
      {hours_logged}
    </td>
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
  </tr>
);

export default Client;
