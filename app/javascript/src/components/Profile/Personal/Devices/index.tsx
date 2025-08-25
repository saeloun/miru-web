import React, { useEffect, useState } from "react";

import deviceApi from "apis/devices";
import { MobileEditHeader } from "common/Mobile/MobileEditHeader";
import { useProfileContext } from "context/Profile/ProfileContext";
import { useUserContext } from "context/UserContext";
import { useNavigate, useParams } from "react-router-dom";
import { useCurrentUser } from "~/hooks/useCurrentUser";

import { Device } from "./Device";
import StaticPage from "./StaticPage";

const AllocatedDevicesDetails = () => {
  const { user, isDesktop } = useUserContext();
  const { currentUser } = useCurrentUser();
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
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {isDesktop ? (
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Allocated Devices
                </h1>
                <p className="mt-1 text-gray-600">
                  Manage and view all devices allocated to{" "}
                  {isFromSettings ? "you" : "this team member"}
                </p>
              </div>
              {devices.length > 0 && (
                <button
                  onClick={handleEdit}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
                >
                  Edit Devices
                </button>
              )}
            </div>
          </div>
        ) : (
          <MobileEditHeader
            href="edit"
            title="Allocated Devices"
            backHref={
              isCalledFromSettings
                ? "/settings/"
                : `/team/${currentUserId || memberId}`
            }
          />
        )}
        {isLoading ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <StaticPage devices={devices} />
        )}
      </div>
    </div>
  );
};

export default AllocatedDevicesDetails;
