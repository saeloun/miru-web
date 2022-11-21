import React from "react";

import { PenIcon, DeleteIcon } from "miruIcons";

const StaticPage = () => (
  <div className="bg-miru-gray-100 px-10 mt-4 h-full">
    <table className="w-full">
      <thead>
        <tr className="flex flex-row items-center border-b border-miru-gray-400">
          <th className="w-2/12 reiTable__th">DATE</th>
          <th className="w-4/12 reiTable__th">DESCRIPTION</th>
          <th className="w-3/12 reiTable__th">STORE/MODE</th>
          <th className="w-1/12 reiTable__th">AMOUNT</th>
          <th className="w-2/12 reiTable__th"></th>
        </tr>
      </thead>
      <tbody>
        <tr className="flex flex-row items-center items-center border-b border-miru-gray-400">
          <td className="w-2/12 reiTable__tr">22.04.2022</td>
          <td className="w-4/12 reiTable__tr">
            Medium annual team subscription
          </td>
          <td className="w-3/12 reiTable__tr">Online/Netbanking</td>
          <td className="w-1/12 reiTable__tr">₹7,500</td>
          <td className="w-2/12 reiTable__tr">
            <button className="ml-5">
              <PenIcon size={16} color="#5B34EA" />
            </button>
            <button className="ml-5">
              <DeleteIcon size={16} color="#5B34EA" />
            </button>
          </td>
        </tr>
        <tr className="flex flex-row items-center items-center">
          <td className="w-2/12 reiTable__tr">22.04.2022</td>
          <td className="w-4/12 reiTable__tr">
            Medium annual team subscription
          </td>
          <td className="w-3/12 reiTable__tr">Online/Netbanking</td>
          <td className="w-1/12 reiTable__tr">₹7,500</td>
          <td className="w-2/12 reiTable__tr">
            <button className="ml-5">
              <PenIcon size={16} color="#5B34EA" />
            </button>
            <button className="ml-5">
              <DeleteIcon size={16} color="#5B34EA" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
);

export default StaticPage;
