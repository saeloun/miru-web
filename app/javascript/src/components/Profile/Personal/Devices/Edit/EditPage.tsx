import React from "react";

import { MobileIcon, DeleteIcon } from "miruIcons";
import "react-phone-number-input/style.css";
import { Button } from "StyledComponents";
import { CustomInputText } from "common/CustomInputText";
import { CustomReactSelect } from "common/CustomReactSelect";
import { Divider } from "common/Divider";

import { deviceTypes } from "../helpers";

const EditPage = ({ devices, addAnotherDevice }) => {
  const setDeviceType = (type: string) => {
    const CurrentType = deviceTypes.filter(device => device.value === type);

    return CurrentType[0];
  };

  return (
    <div className="mt-4 h-full bg-miru-gray-100 px-10">
      <div className="flex py-10">
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
        <div className="w-10/12">
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
                      </div>
                      <div className="flex w-1/2 flex-col px-2">
                        <CustomInputText
                          id="model"
                          label="Model"
                          name="model"
                          type="text"
                          value={name}
                        />
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
                        />
                      </div>
                      <div className="flex w-1/2 flex-col px-2">
                        <CustomInputText
                          id="memory"
                          label="Memory"
                          name="memory"
                          type="text"
                          value={specifications.ram}
                        />
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
                          />
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
                          />
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
          <div className="mt-10 flex w-11/12 items-center justify-between">
            <Button
              className="mx-2 w-full py-3"
              style="dashed"
              onClick={addAnotherDevice}
            >
              + Add Another Device
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default EditPage;
