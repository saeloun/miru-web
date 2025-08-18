import React from "react";

import EmptyStates from "common/EmptyStates";
import { Monitor, Smartphone, Laptop } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import { Badge } from "components/ui/badge";

const StaticPage = ({ devices }) => {
  const getDeviceIcon = (deviceType: string) => {
    const type = deviceType?.toLowerCase() || "";
    if (type.includes("phone") || type.includes("mobile")) {
      return <Smartphone className="h-5 w-5" />;
    }
    if (type.includes("laptop") || type.includes("macbook")) {
      return <Laptop className="h-5 w-5" />;
    }
    return <Monitor className="h-5 w-5" />;
  };

  const DeviceDetails = ({ device, index }) => {
    const {
      device_type,
      name,
      serial_number,
      specifications: { ram = "", graphics = "", processor = "" } = {},
    } = device;

    return (
      <Card key={index} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                {getDeviceIcon(device_type)}
              </div>
              <div>
                <div className="text-lg font-semibold">{name || `Device ${index + 1}`}</div>
                <div className="text-sm font-normal text-gray-500">{device_type || "Unknown Device"}</div>
              </div>
            </CardTitle>
            {device_type && (
              <Badge variant="outline" className="text-gray-600">
                {device_type}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Serial Number
              </label>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {serial_number || "Not specified"}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Memory (RAM)
              </label>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {ram || "Not specified"}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Processor
              </label>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {processor || "Not specified"}
              </p>
            </div>
            {graphics && (
              <div className="md:col-span-2 lg:col-span-3">
                <label className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Graphics
                </label>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {graphics}
                </p>
              </div>
            )}
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
