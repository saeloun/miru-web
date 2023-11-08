/* eslint-disable no-unused-vars */
import React, { Fragment, useState } from "react";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useNavigate } from "react-router-dom";

import Loader from "common/Loader/index";
import { useUserContext } from "context/UserContext";

import EditPage from "./EditPage";

dayjs.extend(utc);

const AllocatedDevicesEdit = () => {
  const navigate = useNavigate();
  const { isDesktop } = useUserContext();

  const [isLoading, setIsLoading] = useState(false);

  const handleCancelDetails = () => {
    setIsLoading(true);
    navigate(`/settings/devices`, { replace: true });
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
          {isLoading ? <Loader className="min-h-70v" /> : <EditPage />}
        </Fragment>
      )}
    </Fragment>
  );
};

export default AllocatedDevicesEdit;
