import React, { Fragment } from "react";

import { MobileIcon } from "miruIcons";

const StaticPage = ({ devices }) => {
  const DeviceDetails = ({ device }) => {
    const {
      device_type,
      name,
      serial_number,
      specifications: { ram = "", graphics = "", processor = "" } = {},
    } = device;

    return (
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
                <p className="text-miru-dark-purple-1000">{device_type}</p>
              </div>
              <div className="w-6/12">
                <span className="text-xs text-miru-dark-purple-1000">
                  Model
                </span>
                <p className="text-miru-dark-purple-1000">{name}</p>
              </div>
            </div>
            <div className="mt-4 flex">
              <div className="w-6/12">
                <span className="text-xs text-miru-dark-purple-1000">
                  Serial Number
                </span>
                <p className="text-miru-dark-purple-1000">{serial_number}</p>
              </div>
              <div className="w-6/12">
                <span className="text-xs text-miru-dark-purple-1000">
                  Memory
                </span>
                <p className="text-miru-dark-purple-1000">{ram}</p>
              </div>
            </div>
            <div className="mt-4 flex">
              <div className="w-6/12">
                <span className="text-xs text-miru-dark-purple-1000">
                  Graphics
                </span>
                <p className="text-miru-dark-purple-1000">{graphics}</p>
              </div>
              <div className="w-6/12">
                <span className="text-xs text-miru-dark-purple-1000">
                  Processor
                </span>
                <p className="text-miru-dark-purple-1000">{processor}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Fragment>
      {devices?.map((device, index) => (
        <DeviceDetails device={device} key={index} />
      ))}
    </Fragment>
  );
};

export default StaticPage;
