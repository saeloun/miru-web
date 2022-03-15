import * as React from "react";
import GetClientBar from "./ChartBar";
import { IChartBar } from "./interface";

const ClientBarGraph = ({ clients , totalHours }:IChartBar) => (
  <div className="bg-miru-gray-100 py-10 px-10">
    <div className="flex justify-end">
      <select className="px-3
          py-1.5
          text-base
          font-normal
          bg-transparent bg-clip-padding bg-no-repeat
          border-none
          transition
          ease-in-out
          m-0
          focus:outline-none
          text-miru-dark-purple-600">
        <option className="text-miru-dark-purple-600" value="Jon Smith">
            THIS WEEK
        </option>
      </select>
    </div>
    <p className="mb-3 text-miru-dark-purple-600">
          TOTAL HOURS: <span>{totalHours}</span>
    </p>
    <div className="w-full bg-gray-200 flex h-1">
      {clients.map((client, index) => <GetClientBar
        client={client}
        key={index}
        index={index}
        totalHours={totalHours}
      />)
      }
    </div>
    <div className="flex miru-dark-purple-400 text-normal border-b-2 border-miru-gray-1000 border-b-miru-gray-1000 pb-6 justify-between mt-3">
      <span>
            0
      </span>
      <span>
        {totalHours}
      </span>
    </div>
    <div className="flex pt-6">
      <div className="flex-auto border-r-2 py-2 border-miru-gray-1000 border-r-miru-gray-1000">
        <p className="text-miru-dark-purple-600">
                OVERDUE
        </p>
        <h4 className="text-4xl text-miru-dark-purple-600 mt-3">
                $35.3K
        </h4>
      </div>
      <div className="flex-auto py-2 pl-5">
        <p className="text-miru-dark-purple-600">
                OUTSTANDING
        </p>
        <h4 className="text-4xl mt-3 text-miru-dark-purple-600">
                $35.3K
        </h4>
      </div>
    </div>
  </div>
);

export default ClientBarGraph;
