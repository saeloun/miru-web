import React, { Fragment, useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import deviceApi from "apis/devices";
import Loader from "common/Loader/index";
import { MobileEditHeader } from "common/Mobile/MobileEditHeader";
import DetailsHeader from "components/Profile/DetailsHeader";
import { useUserContext } from "context/UserContext";

import { Device } from "./Device";
import StaticPage from "./StaticPage";

const AllocatedDevicesDetails = () => {
  const { user, isDesktop } = useUserContext();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [devices, setDevices] = useState<Device[]>([]);

  const getDevicesDetail = async () => {
    const res: any = await deviceApi.get(user.id);
    const devicesDetails: Device[] = res.data.devices;
    setDevices(devicesDetails);
    setIsLoading(false);
  };

  useEffect(() => {
    setIsLoading(true);
    getDevicesDetail();
  }, []);

  const handleEdit = () => {
    navigate(`/settings/devices/edit`, { replace: true });
  };

  return (
    <Fragment>
      {isDesktop ? (
        <DetailsHeader
          editAction={handleEdit}
          isDisableUpdateBtn={false}
          showButtons={false}
          subTitle=""
          title="Allocated Devices"
        />
      ) : (
        <MobileEditHeader
          backHref="/settings/"
          href="/settings/devices/edit"
          title="Allocated Devices"
        />
      )}
      {isLoading ? (
        <div className="flex min-h-70v items-center justify-center">
          <Loader />
        </div>
      ) : (
        <StaticPage devices={devices} />
      )}
    </Fragment>
  );
};

export default AllocatedDevicesDetails;
