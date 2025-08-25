import React, { useEffect, useState } from "react";

import deviceApi from "apis/devices";
import Loader from "common/Loader/index";
import { useProfileContext } from "context/Profile/ProfileContext";
import { useUserContext } from "context/UserContext";
import { useNavigate, useParams } from "react-router-dom";
import { Toastr } from "StyledComponents";

import ModernEditPage from "./ModernEditPage";

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
  const { isCalledFromSettings } = useProfileContext();

  // Determine if we're in settings based on URL path as fallback
  const isInSettings = window.location.pathname.includes("/settings/");
  const shouldUseCurrentUser = isCalledFromSettings || isInSettings;

  const navigateToPath = shouldUseCurrentUser
    ? "/settings"
    : `/team/${memberId}`;

  const currentUserId = shouldUseCurrentUser ? user?.id : memberId;
  const [isLoading, setIsLoading] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [errDetails, _setErrDetails] = useState(initialErrState);

  useEffect(() => {
    if (currentUserId) {
      setIsLoading(true);
      getDevicesDetail();
    }
  }, [currentUserId]);

  const getDevicesDetail = async () => {
    if (!currentUserId) return;

    try {
      const res: any = await deviceApi.get(currentUserId);
      const devicesDetails: Device[] = res.data.devices;
      setDevices(devicesDetails);
    } catch (error) {
      console.error("Failed to fetch devices:", error);
      setDevices([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDetails = async (updatedDevices: Device[]) => {
    try {
      setIsLoading(true);
      await deviceApi.update(currentUserId, { devices: updatedDevices });
      Toastr.success("Devices updated successfully");
      navigate(`${navigateToPath}/devices`, { replace: true });
    } catch (error) {
      Toastr.error("Failed to update devices");
      console.error("Update error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelDetails = () => {
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

  return isLoading ? (
    <Loader className="min-h-screen flex items-center justify-center" />
  ) : (
    <ModernEditPage
      devices={devices}
      onSave={handleUpdateDetails}
      onCancel={handleCancelDetails}
      isLoading={isLoading}
    />
  );
};

export default AllocatedDevicesEdit;
