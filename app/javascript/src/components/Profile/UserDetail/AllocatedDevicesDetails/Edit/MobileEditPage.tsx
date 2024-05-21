import React from "react";

import { DeleteIcon, MobileIcon } from "miruIcons";
import "react-phone-number-input/style.css";
import { Button } from "StyledComponents";

import { CustomInputText } from "common/CustomInputText";
import { CustomReactSelect } from "common/CustomReactSelect";
import { Divider } from "common/Divider";
import { ErrorSpan } from "common/ErrorSpan";

import { deviceTypes } from "../helpers";

const inputClass =
  "form__input block w-full appearance-none bg-white p-4 text-sm h-12 focus-within:border-miru-han-purple-1000";

const labelClass =
  "absolute top-0.5 left-1 h-6 z-1 origin-0 bg-white p-2 text-sm font-medium duration-300";

const MobileEditPage = ({
  devices,
  addAnotherDevice,
  handleCancelDetails,
  errDetails,
}) => {
  const setDeviceType = (type: string) => {
    const CurrentType = deviceTypes.filter(device => device.value === type);

    return CurrentType[0];
  };

  return (
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
        <div className="mt-6 w-full">
          {devices.map(device => {
            const { id, device_type, name, serial_number, specifications } =
              device;

            return (
              <div key={id}>
                <div className="flex w-full flex-row items-start">
                  <div className="w-11/12">
                    <div className="flex flex-row py-3">
                      <div className="flex w-1/2 flex-col px-2">
                        <CustomReactSelect
                          id="device_type"
                          label="Device Type"
                          name="device_type"
                          options={deviceTypes}
                          value={setDeviceType(device_type)}
                        />
                        {errDetails.device_type_err && (
                          <ErrorSpan
                            className="text-xs text-red-600"
                            message={errDetails.device_type_err}
                          />
                        )}
                      </div>
                      <div className="flex w-1/2 flex-col px-2">
                        <CustomInputText
                          id="model"
                          label="Model"
                          name="model"
                          type="text"
                          value={name}
                          inputBoxClassName={`${inputClass} ${
                            errDetails.name_err
                              ? "border-red-600"
                              : "border-miru-gray-1000"
                          }`}
                          labelClassName={`${labelClass} ${
                            errDetails.name_err
                              ? "text-red-600"
                              : "text-miru-dark-purple-200"
                          }`}
                        />
                        {errDetails.name_err && (
                          <ErrorSpan
                            className="text-xs text-red-600"
                            message={errDetails.name_err}
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex flex-row py-3">
                      <div className="flex w-1/2 flex-col px-2">
                        <CustomInputText
                          id="serial_number"
                          label="Serial Number"
                          name="serial_number"
                          type="text"
                          value={serial_number}
                          inputBoxClassName={`${inputClass} ${
                            errDetails.serial_number_err
                              ? "border-red-600"
                              : "border-miru-gray-1000"
                          }`}
                          labelClassName={`${labelClass} ${
                            errDetails.serial_number_err
                              ? "text-red-600"
                              : "text-miru-dark-purple-200"
                          }`}
                        />
                        {errDetails.serial_number_err && (
                          <ErrorSpan
                            className="text-xs text-red-600"
                            message={errDetails.serial_number_err}
                          />
                        )}
                      </div>
                      <div className="flex w-1/2 flex-col px-2">
                        <CustomInputText
                          id="memory"
                          label="Memory"
                          name="memory"
                          type="text"
                          value={specifications.ram}
                          inputBoxClassName={`${inputClass} ${
                            errDetails.specifications_err.ram_err
                              ? "border-red-600"
                              : "border-miru-gray-1000"
                          }`}
                          labelClassName={`${labelClass} ${
                            errDetails.specifications_err.ram_err
                              ? "text-red-600"
                              : "text-miru-dark-purple-200"
                          }`}
                        />
                        {errDetails.specifications_err.ram_err && (
                          <ErrorSpan
                            className="text-xs text-red-600"
                            message={errDetails.specifications_err.ram_err}
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex flex-row py-3">
                      <div className="flex w-1/2 flex-col">
                        <div className="field relative flex w-full flex-col px-2">
                          <CustomInputText
                            id="graphics"
                            label="Graphics"
                            name="graphics"
                            type="text"
                            value={specifications.graphics}
                            inputBoxClassName={`${inputClass} ${
                              errDetails.specifications_err.graphics_err
                                ? "border-red-600"
                                : "border-miru-gray-1000"
                            }`}
                            labelClassName={`${labelClass} ${
                              errDetails.specifications_err.graphics_err
                                ? "text-red-600"
                                : "text-miru-dark-purple-200"
                            }`}
                          />
                          {errDetails.specifications_err.graphics_err && (
                            <ErrorSpan
                              className="text-xs text-red-600"
                              message={
                                errDetails.specifications_err.graphics_err
                              }
                            />
                          )}
                        </div>
                      </div>
                      <div className="flex w-1/2 flex-col">
                        <div className="field relative flex w-full flex-col px-2">
                          <CustomInputText
                            id="processor"
                            label="Processor"
                            name="processor"
                            type="text"
                            value={specifications.processor}
                            inputBoxClassName={`${inputClass} ${
                              errDetails.specifications_err.processor_err
                                ? "border-red-600"
                                : "border-miru-gray-1000"
                            }`}
                            labelClassName={`${labelClass} ${
                              errDetails.specifications_err.processor_err
                                ? "text-red-600"
                                : "text-miru-dark-purple-200"
                            }`}
                          />
                          {errDetails.specifications_err.processor_err && (
                            <ErrorSpan
                              className="text-xs text-red-600"
                              message={
                                errDetails.specifications_err.processor_err
                              }
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex w-1/12 items-center justify-center py-5">
                    <Button className="p-2 text-center" style="ternary">
                      <DeleteIcon />
                    </Button>
                  </div>
                </div>
                <Divider CustomStyle="my-5 w-11/12" />
              </div>
            );
          })}
          <div className="mt-10 flex w-full items-center justify-between">
            <Button
              className="w-full py-3"
              style="dashed"
              onClick={addAnotherDevice}
            >
              + Add Another Device
            </Button>
          </div>
        </div>
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
};

export default MobileEditPage;
