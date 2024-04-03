/* eslint-disable no-unused-vars */
import React, { Fragment, useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";
import * as Yup from "yup";

import deviceApi from "apis/devices";
import Loader from "common/Loader/index";
import { MobileDetailsHeader } from "common/Mobile/MobileDetailsHeader";
import { useUserContext } from "context/UserContext";

import EditPage from "./EditPage";
import MobileEditPage from "./MobileEditPage";
import { devicesSchema } from "./validationSchema";

import { Device } from "../Device";

const AllocatedDevicesEdit = () => {
  const initialErrState = [];

  const InitialDevicesPayload = {
    update_devices: [],
    add_devices: [],
    remove_devices: [],
  };

  const ArrayOfDevicesSchema = Yup.array().of(devicesSchema);

  const navigate = useNavigate();
  const { isDesktop, user } = useUserContext();

  const [isLoading, setIsLoading] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [updatedDevices, setUpdatedDevices] = useState<Device[]>(devices);
  const [errDetails, setErrDetails] = useState(initialErrState);

  useEffect(() => {
    setIsLoading(true);
    getDevicesDetail();
  }, []);

  const getDevicesDetail = async () => {
    const res: any = await deviceApi.get(user.id);
    const devicesDetails: Device[] = res.data.devices;
    setDevices(devicesDetails);
    setUpdatedDevices(devicesDetails);
    setIsLoading(false);
  };

  const handleCancelDetails = () => {
    setIsLoading(true);
    navigate(`/settings/devices`, { replace: true });
  };

  const addAnotherDevice = () => {
    setUpdatedDevices([
      ...updatedDevices,
      {
        id: "",
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

  const handleDeleteDevice = deletedDevice => {
    setUpdatedDevices(updatedDevices.filter(dev => dev !== deletedDevice));
  };

  const handleDeviceChange = (value, field, index) => {
    const changedDevices = updatedDevices.map((device, i) => {
      const shouldUpdate = i === index;
      if (!shouldUpdate) return device;

      if (field !== "specifications") {
        return { ...device, [field]: value };
      }
      //Here the value is an object:{ field: actualValue }
      const updatedSpecs = { ...device.specifications, ...value };

      return { ...device, specifications: updatedSpecs };
    });

    setUpdatedDevices(changedDevices);
  };

  const handleUpdateDetails = async () => {
    try {
      await ArrayOfDevicesSchema.validate(updatedDevices, {
        abortEarly: false,
      });
      setIsLoading(true);
      const getDifference = (array1, array2) =>
        array1.filter(object1 => !array2.some(object2 => object1 === object2));

      //creating an array which includes removed records
      const removed = devices.filter(e => !updatedDevices.includes(e));

      //creating an array which includes updated and added records
      const unSortedDevices = getDifference(updatedDevices, devices);

      const finalDevices = InitialDevicesPayload;

      //sorting new entries and updated entries into
      unSortedDevices.map(unSorted => {
        if (unSorted.id) {
          finalDevices.update_devices.push(unSorted);
        } else {
          finalDevices.add_devices.push(unSorted);
        }
      });

      //Extracting removed records id
      if (removed.length > 0) {
        removed.map(remove => {
          if ("id" in remove) {
            if (finalDevices.update_devices.length > 0) {
              finalDevices.update_devices.filter(updated => {
                if ("id" in updated && updated.id !== remove.id) {
                  finalDevices.remove_devices.push(remove?.id);
                }
              });
            } else {
              finalDevices.remove_devices.push(remove?.id);
            }
          }
        });
      }

      updateDetails(finalDevices);
    } catch (err) {
      setIsLoading(false);
      const errObj = initialErrState;
      if (err.inner) {
        err.inner.map(item => {
          const itemIndex = parseInt(item.path.split("[")[1]);
          const fieldName = `${item.path.split(".").pop()}_err`;
          const errorMessage = item.message;

          if (!errObj[itemIndex]) {
            errObj[itemIndex] = {};
          }

          errObj[itemIndex][fieldName] = errorMessage;
        });

        setErrDetails(errObj);
      }
    }
  };

  const updateDetails = async updatedDevices => {
    setIsLoading(true);

    const payload = {
      device: updatedDevices,
    };

    await deviceApi.post(user.id, payload);
    setIsLoading(false);
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
              <button
                className="mx-1 cursor-pointer rounded-md border bg-white px-3 py-2 font-bold text-miru-han-purple-1000"
                onClick={handleUpdateDetails}
              >
                Update
              </button>
            </div>
          </div>
          {isLoading ? (
            <Loader className="min-h-70v" />
          ) : (
            <EditPage
              addAnotherDevice={addAnotherDevice}
              devices={updatedDevices}
              errDetails={errDetails}
              handleDeleteDevice={handleDeleteDevice}
              handleDeviceChange={handleDeviceChange}
            />
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
              devices={updatedDevices}
              errDetails={errDetails}
              handleCancelDetails={handleCancelDetails}
              handleDeleteDevice={handleDeleteDevice}
              handleDeviceChange={handleDeviceChange}
            />
          )}
        </Fragment>
      )}
    </Fragment>
  );
};

export default AllocatedDevicesEdit;
