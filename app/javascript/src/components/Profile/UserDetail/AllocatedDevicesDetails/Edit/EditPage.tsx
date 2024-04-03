import React from "react";

import { MobileIcon } from "miruIcons";
import "react-phone-number-input/style.css";

import DeviceForm from "./DeviceForm";

const EditPage = ({
  devices,
  addAnotherDevice,
  handleDeviceChange,
  handleDeleteDevice,
  errDetails,
}) => (
  <div className="mt-4 flex w-full flex-1 bg-miru-gray-100 px-4 lg:px-10">
    <div className="flex w-full py-10">
      <div className="flex w-1/5 pr-4">
        <MobileIcon
          className="mr-2 mt-1 text-miru-dark-purple-1000"
          size={16}
          weight="bold"
        />
        <span className="text-sm font-medium text-miru-dark-purple-1000">
          Devices
        </span>
      </div>
      <DeviceForm
        addAnotherDevice={addAnotherDevice}
        devices={devices}
        errDetails={errDetails}
        handleDeleteDevice={handleDeleteDevice}
        handleDeviceChange={handleDeviceChange}
      />
    </div>
  </div>
);
export default EditPage;
