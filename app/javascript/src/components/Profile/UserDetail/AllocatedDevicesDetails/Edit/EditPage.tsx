import React from "react";

import { MobileIcon } from "miruIcons";
import "react-phone-number-input/style.css";
import { Button } from "StyledComponents";

import { CustomInputText } from "common/CustomInputText";
import { CustomReactSelect } from "common/CustomReactSelect";

const EditPage = () => (
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
      <div className="w-9/12">
        <div className="flex flex-row py-3">
          <div className="flex w-1/2 flex-col px-2">
            <CustomReactSelect
              // handleOnChange={}
              id="device_type"
              label="Device Type"
              name=""
              // options={}
              // value={}
            />
          </div>
          <div className="flex w-1/2 flex-col px-2">
            <CustomInputText
              id="model"
              label="Model"
              name=""
              type="text"
              value=""
              // onChange={}
            />
          </div>
        </div>
        <div className="flex flex-row py-3">
          <div className="flex w-1/2 flex-col px-2">
            <CustomInputText
              id=""
              label="Serial Number"
              name=""
              type="text"
              value=""
              // onChange={}
            />
          </div>
          <div className="flex w-1/2 flex-col px-2">
            <CustomInputText
              id=""
              label="Memory"
              name=""
              type="text"
              value=""
              // onChange={}
            />
          </div>
        </div>
        <div className="flex flex-row py-3">
          <div className="flex w-1/2 flex-col">
            <div className="field relative flex w-full flex-col px-2">
              <CustomInputText
                id=""
                label="Graphics"
                name=""
                type="text"
                value=""
              />
            </div>
          </div>
          <div className="flex w-1/2 flex-col">
            <div className="field relative flex w-full flex-col px-2">
              <CustomInputText
                id=""
                label="Processor"
                name=""
                type="text"
                value=""
              />
            </div>
          </div>
        </div>
        <div className="mt-10 flex w-full items-center justify-between">
          <Button className="mx-2 w-full rounded border border-dashed  border-miru-dark-purple-200 bg-white py-3 text-center text-base font-bold tracking-widest text-miru-dark-purple-200">
            + Add Another Device
          </Button>
        </div>
      </div>
    </div>
  </div>
);
export default EditPage;
