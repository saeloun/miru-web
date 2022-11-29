import React from "react";

import { PenIcon, DeleteIcon } from "miruIcons";

const StaticPage = () => (
  <div className="mt-4 h-full bg-miru-gray-100 px-10">
    <table className="w-full">
      <thead>
        <tr className="flex flex-row items-center border-b border-miru-gray-400">
          <th className="reiTable__th w-2/12">DATE</th>
          <th className="reiTable__th w-4/12">DESCRIPTION</th>
          <th className="reiTable__th w-3/12">STORE/MODE</th>
          <th className="reiTable__th w-1/12">AMOUNT</th>
          <th className="reiTable__th w-2/12" />
        </tr>
      </thead>
      <tbody>
        <tr className="flex flex-row items-center items-center border-b border-miru-gray-400">
          <td className="reiTable__tr w-2/12">22.04.2022</td>
          <td className="reiTable__tr w-4/12">
            Medium annual team subscription
          </td>
          <td className="reiTable__tr w-3/12">Online/Netbanking</td>
          <td className="reiTable__tr w-1/12">₹7,500</td>
          <td className="reiTable__tr w-2/12">
            <button className="ml-5">
              <PenIcon color="#5B34EA" size={16} />
            </button>
            <button className="ml-5">
              <DeleteIcon color="#5B34EA" size={16} />
            </button>
          </td>
        </tr>
        <tr className="flex flex-row items-center items-center">
          <td className="reiTable__tr w-2/12">22.04.2022</td>
          <td className="reiTable__tr w-4/12">
            Medium annual team subscription
          </td>
          <td className="reiTable__tr w-3/12">Online/Netbanking</td>
          <td className="reiTable__tr w-1/12">₹7,500</td>
          <td className="reiTable__tr w-2/12">
            <button className="ml-5">
              <PenIcon color="#5B34EA" size={16} />
            </button>
            <button className="ml-5">
              <DeleteIcon color="#5B34EA" size={16} />
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
);

export default StaticPage;
