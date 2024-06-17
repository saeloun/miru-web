/* eslint-disable no-unused-vars */
import React, { Fragment, useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import deviceApi from "apis/devices";
import Loader from "common/Loader/index";
import { MobileDetailsHeader } from "common/Mobile/MobileDetailsHeader";
import EditHeader from "components/Profile/Common/EditHeader";
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
  const { memberId } = useParams();
  const navigateToPath =
    user.id == memberId ? "/settings" : `/team/${memberId}`;

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

  const handleUpdateDetails = () => {
    //Todo: API integration for update details
  };

  const handleCancelDetails = () => {
    setIsLoading(true);
    navigate(`${navigateToPath}/devices`, { replace: true });
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
          <EditHeader
            showButtons
            cancelAction={handleCancelDetails}
            isDisableUpdateBtn={false}
            saveAction={handleUpdateDetails}
            subTitle=""
            title="Personal Details"
          />
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
            href={`${navigateToPath}/devices`}
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
