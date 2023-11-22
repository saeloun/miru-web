import React from "react";

import { MobileIcon, DeleteIcon } from "miruIcons";
import "react-phone-number-input/style.css";
import { Button } from "StyledComponents";

import { CustomInputText } from "common/CustomInputText";
import { CustomReactSelect } from "common/CustomReactSelect";
import { Divider } from "common/Divider";

import { deviceTypes } from "../helpers";

const EditPage = ({ devices, setDevices }) => {
  const setDeviceType = (type: string) => {
    const CurrentType = deviceTypes.filter(device => device.value === type);

    return CurrentType[0];
  };

  const addAnotherDevice = () => {
    setDevices([
      ...devices,
      {
        device_type: "",
        name: "",
        serial_number: "",
        specifications: {
          graphics: "",
          processor: "",
          ram: "",
        },
      },
    ]);
  };

  return (
    <div className="mt-4 h-full bg-miru-gray-100 px-10">
      <div className="flex border-b border-b-miru-gray-400 py-10">
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
          {devices.map(device => (
            <React.Fragment key={device.id}>
              <div className="flex w-full flex-row items-start">
                <div className="w-11/12">
                  <div className="flex flex-row py-3">
                    <div className="flex w-1/2 flex-col px-2">
                      <CustomReactSelect
                        id="device_type"
                        label="Device Type"
                        name="device_type"
                        options={deviceTypes}
                        value={setDeviceType(device.device_type)}
                      />
                    </div>
                    <div className="flex w-1/2 flex-col px-2">
                      <CustomInputText
                        id="model"
                        label="Model"
                        name="model"
                        type="text"
                        value={device.name}
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
                        value={device.serial_number}
                      />
                    </div>
                    <div className="flex w-1/2 flex-col px-2">
                      <CustomInputText
                        id="memory"
                        label="Memory"
                        name="memory"
                        type="text"
                        value={device.specifications.ram}
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
                          value={device.specifications.graphics}
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
                          value={device.specifications.processor}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex w-1/12 items-center justify-center py-5">
                  <Button className="rounded border-0 bg-transparent p-2 text-center text-miru-han-purple-1000 hover:bg-miru-dark-purple-100 hover:text-miru-han-purple-600">
                    <DeleteIcon />
                  </Button>
                </div>
              </div>
              <Divider CustomStyle="my-5 w-11/12" />
            </React.Fragment>
          ))}
          <div className="mt-10 flex w-full items-center justify-between">
            <Button
              className="mx-2 w-full rounded border border-dashed  border-miru-dark-purple-200 bg-white py-3 text-center text-base font-bold tracking-widest text-miru-dark-purple-200"
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
