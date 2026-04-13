import React, { useEffect, useState } from "react";

import { deviceApi } from "apis/api";
import Loader from "common/Loader/index";
import { MobileEditHeader } from "common/Mobile/MobileEditHeader";
import { useProfileContext } from "context/Profile/ProfileContext";
import { useUserContext } from "context/UserContext";
import { useNavigate, useParams } from "react-router-dom";
import { i18n } from "../../../../i18n";

import { Device } from "./Device";
import DeviceInventorySummary from "./DeviceInventorySummary";

const AllocatedDevicesDetails = () => {
  const { user, isDesktop } = useUserContext();
  const { isCalledFromSettings } = useProfileContext();
  const navigate = useNavigate();
  const { memberId } = useParams();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [devices, setDevices] = useState<Device[]>([]);
  // Determine current user ID based on context
  const isFromSettings = window.location.pathname.startsWith("/settings");
  const currentUserId = isFromSettings ? user?.id : memberId;

  const getDevicesDetail = async () => {
    if (!currentUserId) return;

    try {
      const res: any = await deviceApi.get(currentUserId);
      const devicesDetails: Device[] = res.data.devices;
      setDevices(devicesDetails);
    } catch (error) {
      console.error("Failed to fetch devices:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (currentUserId) {
      setIsLoading(true);
      getDevicesDetail();
    }
  }, [currentUserId, isFromSettings]);

  const handleEdit = () => {
    navigate(`edit`, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {isDesktop ? (
          <div className="mb-6 flex justify-end">
            <button
              onClick={handleEdit}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {devices.length > 0
                ? i18n.t("devices.editDevices")
                : i18n.t("devices.addDevices")}
            </button>
          </div>
        ) : (
          <MobileEditHeader
            href="edit"
            title={i18n.t("navbar.allocatedDevices")}
            backHref={
              isCalledFromSettings
                ? "/settings/"
                : `/team/${currentUserId || memberId}`
            }
          />
        )}
        {isLoading ? (
          <Loader className="min-h-[60vh]" />
        ) : (
          <DeviceInventorySummary devices={devices} />
        )}
      </div>
    </div>
  );
};

export default AllocatedDevicesDetails;
