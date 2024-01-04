/* eslint-disable no-unused-vars */
import React, { Fragment, useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import deviceApi from "apis/devices";
import Loader from "common/Loader/index";
import { MobileDetailsHeader } from "common/Mobile/MobileDetailsHeader";
import { useUserContext } from "context/UserContext";

import EditPage from "./EditPage";
import MobileEditPage from "./MobileEditPage";

import { Device } from "../Device";

const AllocatedDevicesEdit = () => {
  const initialErrState = {
    device_type_err: "",
    name_err: "",
    serial_number_err: "",
    specifications_err: {
      ram_err: "",
      graphics_err: "",
      processor_err: "",
    },
  };
  const navigate = useNavigate();
  const { isDesktop, user } = useUserContext();

  const [isLoading, setIsLoading] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [errDetails, setErrDetails] = useState(initialErrState);

  useEffect(() => {
    setIsLoading(true);
    getDevicesDetail();
  }, []);

  const getDevicesDetail = async () => {
    const res: any = await deviceApi.get(user.id);
    const devicesDetails: Device[] = res.data.devices;
    setDevices(devicesDetails);
    setIsLoading(false);
  };

  const handleCancelDetails = () => {
    setIsLoading(true);
    navigate(`/settings/devices`, { replace: true });
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
    <Fragment>
      {isDesktop && (
        <Fragment>
          <div className="flex items-center justify-between bg-miru-han-purple-1000 px-10 py-4">
            <h1 className="text-2xl font-bold text-white">Allocated Devices</h1>
            <div>
              <button
                className="mx-1 cursor-pointer rounded-md border border-white bg-miru-han-purple-1000 px-3 py-2 font-bold text-white	"
                onClick={handleCancelDetails}
              >
                Cancel
              </button>
              <button className="mx-1 cursor-pointer rounded-md border bg-white px-3 py-2 font-bold text-miru-han-purple-1000">
                Update
              </button>
            </div>
          </div>
          {isLoading ? (
            <Loader className="min-h-70v" />
          ) : (
            <EditPage addAnotherDevice={addAnotherDevice} devices={devices} />
          )}
        </Fragment>
      )}
      {!isDesktop && (
        <Fragment>
          <MobileDetailsHeader
            href="/settings/devices"
            title="Allocated Devices"
          />
          {isLoading ? (
            <Loader className="min-h-70v" />
          ) : (
            <MobileEditPage
              addAnotherDevice={addAnotherDevice}
              devices={devices}
              errDetails={errDetails}
              handleCancelDetails={handleCancelDetails}
            />
          )}
        </Fragment>
      )}
    </Fragment>
  );
};

export default AllocatedDevicesEdit;
