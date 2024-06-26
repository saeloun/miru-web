/* eslint-disable no-unused-vars */
import React, { Fragment, useEffect, useRef, useState } from "react";

import dayjs from "dayjs";
import { useOutsideClick } from "helpers";
import { useNavigate, useParams } from "react-router-dom";
import * as Yup from "yup";

import deviceApi from "apis/devices";
import Loader from "common/Loader/index";
import { MobileDetailsHeader } from "common/Mobile/MobileDetailsHeader";
import EditHeader from "components/Profile/Common/EditHeader";
import { useProfileContext } from "context/Profile/ProfileContext";
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
  const { isDesktop, user, company } = useUserContext();
  const { memberId } = useParams();
  const { isCalledFromSettings } = useProfileContext();
  const navigateToPath = isCalledFromSettings
    ? "/settings"
    : `/team/${memberId}`;

  const currentUserId = isCalledFromSettings ? user.id : memberId;
  const [isLoading, setIsLoading] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [updatedDevices, setUpdatedDevices] = useState<Device[]>(devices);
  const [errDetails, setErrDetails] = useState<object>(initialErrState);
  const [dateFormat, setDateFormat] = useState<string>("DD-MM-YYYY");
  const [showDOAPicker, setShowDOAPicker] = useState<object>({
    visibility: false,
    index: 0,
  });

  const [showDOEPicker, setShowDOEPicker] = useState<object>({
    visibility: false,
    index: 0,
  });

  const DOARef = useRef(null);
  const DOERef = useRef(null);

  useOutsideClick(DOARef, () =>
    setShowDOAPicker({
      visibility: false,
      index: 0,
    })
  );

  useOutsideClick(DOERef, () =>
    setShowDOEPicker({
      visibility: false,
      index: 0,
    })
  );

  useEffect(() => {
    setIsLoading(true);
    getDevicesDetail();
    setDateFormat(company.date_format);
  }, []);

  const getDevicesDetail = async () => {
    const res: any = await deviceApi.get(currentUserId);
    const devicesDetails: Device[] = res.data.devices;
    setDevices(devicesDetails);
    setUpdatedDevices(devicesDetails);
    setIsLoading(false);
  };

  const handleCancelDetails = () => {
    setIsLoading(true);
    navigate(`${navigateToPath}/devices`, { replace: true });
  };

  const addAnotherDevice = () => {
    setUpdatedDevices([
      ...updatedDevices,
      {
        id: "",
        device_type: "",
        name: "",
        serial_number: "",
        insurance_bought_date: "",
        insurance_expiry_date: "",
        is_insured: false,
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

  const handleDOAChage = (date, index) => {
    setShowDOAPicker({
      visibility: false,
      index: 0,
    });
    const FormattedDate = dayjs(date).format("YYYY-MM-DD");
    handleDeviceChange(FormattedDate, "insurance_bought_date", index);
  };

  const handleIsInsured = (value, index) => {
    handleDeviceChange(value.target.checked, "is_insured", index);
  };

  const handleDOEChage = (date, index) => {
    setShowDOEPicker({
      visibility: false,
      index: 0,
    });
    const FormattedDate = dayjs(date).format("YYYY-MM-DD");
    handleDeviceChange(FormattedDate, "insurance_expiry_date", index);
  };

  const handleDeviceChange = (value, field, index) => {
    const changedDevices = updatedDevices.map((device, i) => {
      const shouldUpdate = i === index;
      if (!shouldUpdate) return device;

      if (field !== "specifications") {
        return { ...device, [field]: value };
      }
      //Here the value is an object: { field: actualValue }
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
          <EditHeader
            showButtons
            cancelAction={handleCancelDetails}
            isDisableUpdateBtn={false}
            saveAction={handleUpdateDetails}
            subTitle=""
            title="Allocated Devices"
          />
          {isLoading ? (
            <Loader className="min-h-70v" />
          ) : (
            <EditPage
              DOARef={DOARef}
              DOERef={DOERef}
              addAnotherDevice={addAnotherDevice}
              dateFormat={dateFormat}
              devices={updatedDevices}
              errDetails={errDetails}
              handleDOAChage={handleDOAChage}
              handleDOEChage={handleDOEChage}
              handleDeleteDevice={handleDeleteDevice}
              handleDeviceChange={handleDeviceChange}
              handleIsInsured={handleIsInsured}
              setShowDOAPicker={setShowDOAPicker}
              setShowDOEPicker={setShowDOEPicker}
              showDOAPicker={showDOAPicker}
              showDOEPicker={showDOEPicker}
            />
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
              DOARef={DOARef}
              DOERef={DOERef}
              addAnotherDevice={addAnotherDevice}
              dateFormat={dateFormat}
              devices={updatedDevices}
              errDetails={errDetails}
              handleCancelDetails={handleCancelDetails}
              handleDOAChage={handleDOAChage}
              handleDOEChage={handleDOEChage}
              handleDeleteDevice={handleDeleteDevice}
              handleDeviceChange={handleDeviceChange}
              handleIsInsured={handleIsInsured}
              setShowDOAPicker={setShowDOAPicker}
              setShowDOEPicker={setShowDOEPicker}
              showDOAPicker={showDOAPicker}
              showDOEPicker={showDOEPicker}
            />
          )}
        </Fragment>
      )}
    </Fragment>
  );
};

export default AllocatedDevicesEdit;
