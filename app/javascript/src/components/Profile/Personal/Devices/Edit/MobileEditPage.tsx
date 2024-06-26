import React from "react";

import { MobileIcon } from "miruIcons";
import "react-phone-number-input/style.css";
import { Button } from "StyledComponents";

import DeviceForm from "./DeviceForm";

const MobileEditPage = ({
  devices,
  addAnotherDevice,
  handleDeviceChange,
  handleDeleteDevice,
  errDetails,
  DOARef,
  DOERef,
  dateFormat,
  showDOAPicker,
  showDOEPicker,
  setShowDOAPicker,
  setShowDOEPicker,
  handleDOAChage,
  handleDOEChage,
  handleIsInsured,
  handleCancelDetails,
}) => (
  <div className="flex h-full flex-col justify-between overflow-scroll bg-miru-gray-100 p-4">
    <div className="flex flex-col py-10">
      <div className="my-2 flex w-full px-2">
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
        DOARef={DOARef}
        DOERef={DOERef}
        addAnotherDevice={addAnotherDevice}
        dateFormat={dateFormat}
        devices={devices}
        errDetails={errDetails}
        handleDOAChage={handleDOAChage}
        handleDOEChage={handleDOEChage}
        handleDeleteDevice={handleDeleteDevice}
        handleDeviceChange={handleDeviceChange}
        handleIsInsured={handleIsInsured}
        setShowDOAPicker={setShowDOAPicker}
        setShowDOEPicker={setShowDOEPicker}
        showDOAPicker={showDOAPicker}
        showDOEPicker={showDOEPicker}
      />
    </div>
    <div className="mt-10 mb-5 flex items-center justify-between gap-x-2">
      <div className="w-1/2 text-center">
        <Button
          className="w-full"
          style="secondary"
          onClick={handleCancelDetails}
        >
          Cancel
        </Button>
      </div>
      <div className="w-1/2 text-center">
        <Button className="w-full">Update</Button>
      </div>
    </div>
  </div>
);

export default MobileEditPage;
