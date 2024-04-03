import React from "react";

import { DeleteIcon } from "miruIcons";
import { Button } from "StyledComponents";

import { CustomInputText } from "common/CustomInputText";
import CustomReactSelect from "common/CustomReactSelect";
import { Divider } from "common/Divider";
import EmptyStates from "common/EmptyStates";
import { ErrorSpan } from "common/ErrorSpan";

import { deviceTypes } from "../helpers";

const inputClass =
  "form__input block w-full appearance-none bg-white p-4 text-sm h-12 focus-within:border-miru-han-purple-1000";

const labelClass =
  "absolute top-0.5 left-1 h-6 z-1 origin-0 bg-white p-2 text-sm font-medium duration-300";

const DeviceForm = ({
  devices,
  handleDeviceChange,
  errDetails,
  addAnotherDevice,
  handleDeleteDevice,
}) => (
  <div className="mt-6 w-full lg:mt-0 lg:w-10/12">
    {devices.length > 0 ? (
      devices.map((device, index) => {
        const { id, device_type, name, serial_number, specifications } = device;

        const typeLabel =
          device_type.charAt(0).toUpperCase() + device_type.slice(1);

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
                      handleOnChange={e => {
                        handleDeviceChange(e.value, "device_type", index);
                      }}
                      value={{
                        label: typeLabel,
                        value: device_type,
                      }}
                    />
                    {errDetails[index]?.device_type_err && (
                      <ErrorSpan
                        className="text-xs text-red-600"
                        message={errDetails[index]?.device_type_err}
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
                        errDetails[index]?.name_err
                          ? "border-red-600"
                          : "border-miru-gray-1000"
                      }`}
                      labelClassName={`${labelClass} ${
                        errDetails[index]?.name_err
                          ? "text-red-600"
                          : "text-miru-dark-purple-200"
                      }`}
                      onChange={e => {
                        handleDeviceChange(e.target.value, "name", index);
                      }}
                    />
                    {errDetails[index]?.name_err && (
                      <ErrorSpan
                        className="text-xs text-red-600"
                        message={errDetails[index]?.name_err}
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
                        errDetails[index]?.serial_number_err
                          ? "border-red-600"
                          : "border-miru-gray-1000"
                      }`}
                      labelClassName={`${labelClass} ${
                        errDetails[index]?.serial_number_err
                          ? "text-red-600"
                          : "text-miru-dark-purple-200"
                      }`}
                      onChange={e => {
                        handleDeviceChange(
                          e.target.value,
                          "serial_number",
                          index
                        );
                      }}
                    />
                    {errDetails[index]?.serial_number_err && (
                      <ErrorSpan
                        className="text-xs text-red-600"
                        message={errDetails[index]?.serial_number_err}
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
                        errDetails[index]?.ram_err
                          ? "border-red-600"
                          : "border-miru-gray-1000"
                      }`}
                      labelClassName={`${labelClass} ${
                        errDetails[index]?.ram_err
                          ? "text-red-600"
                          : "text-miru-dark-purple-200"
                      }`}
                      onChange={e => {
                        handleDeviceChange(
                          { ram: e.target.value },
                          "specifications",
                          index
                        );
                      }}
                    />
                    {errDetails[index]?.ram_err && (
                      <ErrorSpan
                        className="text-xs text-red-600"
                        message={errDetails[index]?.ram_err}
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
                          errDetails[index]?.graphics_err
                            ? "border-red-600"
                            : "border-miru-gray-1000"
                        }`}
                        labelClassName={`${labelClass} ${
                          errDetails[index]?.graphics_err
                            ? "text-red-600"
                            : "text-miru-dark-purple-200"
                        }`}
                        onChange={e => {
                          handleDeviceChange(
                            { graphics: e.target.value },
                            "specifications",
                            index
                          );
                        }}
                      />
                      {errDetails[index]?.graphics_err && (
                        <ErrorSpan
                          className="text-xs text-red-600"
                          message={errDetails[index]?.graphics_err}
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
                          errDetails[index]?.processor_err
                            ? "border-red-600"
                            : "border-miru-gray-1000"
                        }`}
                        labelClassName={`${labelClass} ${
                          errDetails[index]?.processor_err
                            ? "text-red-600"
                            : "text-miru-dark-purple-200"
                        }`}
                        onChange={e => {
                          handleDeviceChange(
                            { processor: e.target.value },
                            "specifications",
                            index
                          );
                        }}
                      />
                      {errDetails[index]?.processor_err && (
                        <ErrorSpan
                          className="text-xs text-red-600"
                          message={errDetails[index]?.processor_err}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex w-1/12 items-center justify-center py-5">
                <Button
                  className="p-2 text-center"
                  style="ternary"
                  onClick={() => handleDeleteDevice(device)}
                >
                  <DeleteIcon />
                </Button>
              </div>
            </div>
            {index + 1 < devices.length && (
              <Divider CustomStyle="my-5 w-11/12" />
            )}
          </div>
        );
      })
    ) : (
      <EmptyStates
        Message="No devices found"
        containerClassName="h-full"
        showNoSearchResultState={false}
      />
    )}
    <div className="mt-10 flex w-full items-center justify-between">
      <Button className="w-full py-3" style="dashed" onClick={addAnotherDevice}>
        + Add Another Device
      </Button>
    </div>
  </div>
);

export default DeviceForm;
