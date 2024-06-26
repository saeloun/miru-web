import React, { Fragment } from "react";

import dayjs from "dayjs";
import { MobileIcon } from "miruIcons";

import { Divider } from "common/Divider";
import EmptyStates from "common/EmptyStates";

const StaticPage = ({ devices, dateFormat }) => {
  const DeviceDetails = ({ device }) => {
    const {
      device_type,
      name,
      serial_number,
      is_insured,
      insurance_activation_date,
      insurance_expiry_date,

      specifications: { ram = "", graphics = "", processor = "" } = {},
    } = device;

    return (
      <div className="w-4/5">
        <div className="flex">
          <div className="w-6/12">
            <span className="text-xs text-miru-dark-purple-1000">
              Device Type
            </span>
            <p className="text-miru-dark-purple-1000">{device_type || "-"}</p>
          </div>
          <div className="w-6/12">
            <span className="text-xs text-miru-dark-purple-1000">Model</span>
            <p className="text-miru-dark-purple-1000">{name || "-"}</p>
          </div>
        </div>
        <div className="mt-4 flex">
          <div className="w-6/12">
            <span className="text-xs text-miru-dark-purple-1000">
              Serial Number
            </span>
            <p className="text-miru-dark-purple-1000">{serial_number || "-"}</p>
          </div>
          <div className="w-6/12">
            <span className="text-xs text-miru-dark-purple-1000">Memory</span>
            <p className="text-miru-dark-purple-1000">{ram || "-"}</p>
          </div>
        </div>
        <div className="mt-4 flex">
          <div className="w-6/12">
            <span className="text-xs text-miru-dark-purple-1000">Graphics</span>
            <p className="text-miru-dark-purple-1000">{graphics || "-"}</p>
          </div>
          <div className="w-6/12">
            <span className="text-xs text-miru-dark-purple-1000">
              Processor
            </span>
            <p className="text-miru-dark-purple-1000">{processor || "-"}</p>
          </div>
        </div>
        {is_insured && (
          <div className="mt-4 flex">
            <div className="w-6/12">
              <span className="text-xs text-miru-dark-purple-1000">
                Insurance Activation Date
              </span>
              <p className="text-miru-dark-purple-1000">
                {dayjs(insurance_activation_date).format(dateFormat) || "-"}
              </p>
            </div>
            <div className="w-6/12">
              <span className="text-xs text-miru-dark-purple-1000">
                Insurance Expiry Date
              </span>
              <p className="text-miru-dark-purple-1000">
                {dayjs(insurance_expiry_date).format(dateFormat) || "-"}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Fragment>
      {devices.length > 0 ? (
        <div className="mt-4 h-full flex-1 bg-miru-gray-100 px-4 lg:h-auto lg:px-10">
          <div className="py-10 lg:flex">
            <div className="flex py-5 lg:w-1/5 lg:py-0 lg:pr-4">
              <MobileIcon
                className="mr-4 mt-1 text-miru-dark-purple-1000"
                size={16}
                weight="bold"
              />
              <span className="text-sm font-medium text-miru-dark-purple-1000">
                Devices
              </span>
            </div>
            <div className="flex w-full flex-col">
              {devices.map((device, index) => (
                <div key={index}>
                  <DeviceDetails device={device} />
                  {index + 1 < devices.length && (
                    <Divider CustomStyle="my-5 w-11/12" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <EmptyStates
          Message="No devices found"
          containerClassName="h-full"
          showNoSearchResultState={false}
        />
      )}
    </Fragment>
  );
};

export default StaticPage;
