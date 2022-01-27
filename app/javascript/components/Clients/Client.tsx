import * as React from "react";
import { IClient } from "apis/clients";

const Client = ({
  id,
  company_id,
  name,
  email,
  phone,
  address,
  country,
  timezone,
  created_at
}: IClient) => (
  <tr key={id}>
    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
      {id}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
      {company_id}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
      {name}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
      {email}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
      {phone}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
      {address}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
      {country}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
      {timezone}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
      {created_at}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
      <a href="#" className="text-indigo-600 hover:text-indigo-900">
        Edit
      </a>
    </td>
  </tr>
);

export default Client;
