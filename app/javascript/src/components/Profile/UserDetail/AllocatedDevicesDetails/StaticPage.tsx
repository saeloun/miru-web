import React from "react";

import { MobileIcon } from "miruIcons";

const StaticPage = () => (
  <div className="mt-4 h-full bg-miru-gray-100 px-10">
    <div className="flex border-b border-b-miru-gray-400 py-10">
      <div className="flex w-1/5 pr-4">
        <MobileIcon
          className="mr-4 mt-1 text-miru-dark-purple-1000"
          size={16}
          weight="bold"
        />
        <span className="text-sm font-medium text-miru-dark-purple-1000">
          Devices
        </span>
      </div>
      <div className="w-4/5">
        <div className="flex">
          <div className="w-6/12">
            <span className="text-xs text-miru-dark-purple-1000">
              Device Type
            </span>
            <p className="text-miru-dark-purple-1000">Laptop</p>
          </div>
          <div className="w-6/12">
            <span className="text-xs text-miru-dark-purple-1000">Model</span>
            <p className="text-miru-dark-purple-1000">
              Macbook Pro 13-inch, 2020, Four Thunderbolt 3 ports
            </p>
          </div>
        </div>
        <div className="mt-4 flex">
          <div className="w-6/12">
            <span className="text-xs text-miru-dark-purple-1000">
              Serial Number
            </span>
            <p className="text-miru-dark-purple-1000">CF4C6BE4C742</p>
          </div>
          <div className="w-6/12">
            <span className="text-xs text-miru-dark-purple-1000">Memory</span>
            <p className="text-miru-dark-purple-1000">16 GB 3733 MHz LPDDR4X</p>
          </div>
        </div>
        <div className="mt-4 flex">
          <div className="w-6/12">
            <span className="text-xs text-miru-dark-purple-1000">Graphics</span>
            <p className="text-miru-dark-purple-1000">
              Intel Iris Plus Graphics 1536 MB
            </p>
          </div>
          <div className="w-6/12">
            <span className="text-xs text-miru-dark-purple-1000">
              Processor
            </span>
            <p className="text-miru-dark-purple-1000">
              2 GHz Quad-Core Intel Core I5
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default StaticPage;
