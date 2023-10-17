import React, { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import deviceApi from "apis/devices";
import Loader from "common/Loader/index";
import DetailsHeader from "components/Profile/DetailsHeader";
import { useUserContext } from "context/UserContext";

import { Device } from "./Device";
import StaticPage from "./StaticPage";

const AllocatedDevicesDetails = () => {
  const { user } = useUserContext();
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

  const handleEditClick = () => {
    navigate(`/profile/edit/devices-details`, { replace: true });
  };

  return (
    <div>
      <DetailsHeader
        showButtons
        editAction={handleEditClick}
        isDisableUpdateBtn={false}
        subTitle=""
        title="Allocated Devices"
      />
      {isLoading ? (
        <div className="flex min-h-70v items-center justify-center">
          <Loader />
        </div>
      ) : (
        <StaticPage devices={devices} />
      )}
    </div>
  );
};

export default AllocatedDevicesDetails;
