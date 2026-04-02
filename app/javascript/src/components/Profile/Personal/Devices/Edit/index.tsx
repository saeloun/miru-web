import React, { useEffect, useState } from "react";

import { deviceApi } from "apis/api";
import Loader from "common/Loader/index";
import { useProfileContext } from "context/Profile/ProfileContext";
import { useUserContext } from "context/UserContext";
import { useNavigate, useParams } from "react-router-dom";
import { Toastr } from "StyledComponents";

import DeviceEditPage from "./Page";

import { Device } from "../Device";

const AllocatedDevicesEdit = () => {
  const navigate = useNavigate();
  const { user } = useUserContext();
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
  const [initialDevices, setInitialDevices] = useState<Device[]>([]);

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
      setInitialDevices(devicesDetails);
    } catch (error) {
      console.error("Failed to fetch devices:", error);
      setDevices([]);
      setInitialDevices([]);
    } finally {
      setIsLoading(false);
    }
  };

  const devicePayload = (device: Device) => ({
    device: {
      device_type: device.device_type,
      name: device.name,
      serial_number: device.serial_number,
      specifications: device.specifications,
    },
  });

  const handleUpdateDetails = async (updatedDevices: Device[]) => {
    try {
      setIsLoading(true);
      const persistedDevices = updatedDevices.filter(device => device.id);
      const newDevices = updatedDevices.filter(device => !device.id);
      const removedDevices = initialDevices.filter(
        device =>
          device.id && !updatedDevices.some(updated => updated.id === device.id)
      );

      await Promise.all([
        ...persistedDevices.map(device =>
          deviceApi.update(currentUserId, device.id, devicePayload(device))
        ),
        ...newDevices.map(device =>
          deviceApi.create(currentUserId, devicePayload(device))
        ),
        ...removedDevices.map(device =>
          deviceApi.destroy(currentUserId, device.id)
        ),
      ]);

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

  return isLoading ? (
    <Loader className="min-h-screen flex items-center justify-center" />
  ) : (
    <DeviceEditPage
      devices={devices}
      onSave={handleUpdateDetails}
      onCancel={handleCancelDetails}
      isLoading={isLoading}
    />
  );
};

export default AllocatedDevicesEdit;
