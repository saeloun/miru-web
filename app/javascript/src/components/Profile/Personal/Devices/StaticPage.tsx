import React from "react";

import EmptyStates from "common/EmptyStates";
import { MobileIcon } from "miruIcons";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";

const StaticPage = ({ devices }) => {
  const DeviceDetails = ({ device, index }) => {
    const {
      device_type,
      name,
      serial_number,
      specifications: { ram = "", graphics = "", processor = "" } = {},
    } = device;

    return (
      <Card key={index}>
        <CardHeader>
          <CardTitle className="flex items-center text-base font-bold text-miru-dark-purple-1000">
            <MobileIcon
              className="mr-2"
              color="#1D1A31"
              size={16}
              weight="bold"
            />
            Device {index + 1}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <span className="text-sm font-semibold text-miru-dark-purple-600">
                Device Type
              </span>
              <p className="text-base text-miru-dark-purple-1000">
                {device_type || "-"}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-sm font-semibold text-miru-dark-purple-600">
                Model
              </span>
              <p className="text-base text-miru-dark-purple-1000">
                {name || "-"}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-sm font-semibold text-miru-dark-purple-600">
                Serial Number
              </span>
              <p className="text-base text-miru-dark-purple-1000">
                {serial_number || "-"}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-sm font-semibold text-miru-dark-purple-600">
                Memory
              </span>
              <p className="text-base text-miru-dark-purple-1000">
                {ram || "-"}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-sm font-semibold text-miru-dark-purple-600">
                Graphics
              </span>
              <p className="text-base text-miru-dark-purple-1000">
                {graphics || "-"}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-sm font-semibold text-miru-dark-purple-600">
                Processor
              </span>
              <p className="text-base text-miru-dark-purple-1000">
                {processor || "-"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="mt-4 space-y-6 px-4 md:px-10 lg:px-0">
      {devices.length > 0 ? (
        devices.map((device, index) => (
          <DeviceDetails device={device} index={index} key={index} />
        ))
      ) : (
        <EmptyStates
          Message="No devices found"
          containerClassName="h-full"
          showNoSearchResultState={false}
        />
      )}
    </div>
  );
};

export default StaticPage;
