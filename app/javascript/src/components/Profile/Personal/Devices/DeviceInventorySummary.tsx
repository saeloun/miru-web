import React from "react";

import EmptyStates from "common/EmptyStates";
import { Desktop, DeviceMobile, Laptop } from "phosphor-react";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import { Badge } from "components/ui/badge";
import { i18n } from "../../../../i18n";

const DeviceInventoryCard = ({ device, index, getDeviceIcon }) => {
  const {
    device_type,
    name,
    serial_number,
    specifications: { ram = "", graphics = "", processor = "" } = {},
  } = device;

  return (
    <Card
      key={index}
      className="border-border shadow-sm transition-shadow hover:shadow-md"
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold text-foreground">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              {getDeviceIcon(device_type)}
            </div>
            <div>
              <div className="text-lg font-semibold">
                {name || `${i18n.t("devices.device")} ${index + 1}`}
              </div>
              <div className="text-sm font-normal text-muted-foreground">
                {device_type || i18n.t("devices.unknownDevice")}
              </div>
            </div>
          </CardTitle>
          {device_type && (
            <Badge variant="outline" className="text-muted-foreground">
              {device_type}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {i18n.t("devices.serialNumber")}
            </label>
            <p className="mt-1 text-sm font-medium text-foreground">
              {serial_number || i18n.t("devices.notSpecified")}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {i18n.t("devices.memory")}
            </label>
            <p className="mt-1 text-sm font-medium text-foreground">
              {ram || i18n.t("devices.notSpecified")}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {i18n.t("devices.processor")}
            </label>
            <p className="mt-1 text-sm font-medium text-foreground">
              {processor || i18n.t("devices.notSpecified")}
            </p>
          </div>
          {graphics && (
            <div className="md:col-span-2 lg:col-span-3">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {i18n.t("devices.graphics")}
              </label>
              <p className="mt-1 text-sm font-medium text-foreground">
                {graphics}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const DeviceInventorySummary = ({ devices }) => {
  const getDeviceIcon = (deviceType: string) => {
    const type = deviceType?.toLowerCase() || "";
    if (type.includes("phone") || type.includes("mobile")) {
      return <DeviceMobile className="h-5 w-5" />;
    }

    if (type.includes("laptop") || type.includes("macbook")) {
      return <Laptop className="h-5 w-5" />;
    }

    return <Desktop className="h-5 w-5" />;
  };

  return (
    <div className="mt-4 space-y-6 px-4 md:px-10 lg:px-0">
      {devices.length > 0 ? (
        devices.map((device, index) => (
          <DeviceInventoryCard
            device={device}
            getDeviceIcon={getDeviceIcon}
            index={index}
            key={index}
          />
        ))
      ) : (
        <EmptyStates
          Message={i18n.t("devices.noDevicesFound")}
          containerClassName="h-full"
          showNoSearchResultState={false}
        />
      )}
    </div>
  );
};

export default DeviceInventorySummary;
