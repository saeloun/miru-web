import React, { useEffect, useState } from "react";

import { GooglePlayLogo, AppStoreLogo, PaperPlaneTilt, XCircle } from "phosphor-react";
import { CircleWavyWarning } from "phosphor-react";
import { useCookies } from "react-cookie";
import { useSearchParams } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import ReactTooltip from "react-tooltip";

import { setAuthHeaders, registerIntercepts } from "apis/axios";
import devicesApi from "apis/devices";
import ConfirmDialog from "common/Modal/ConfirmDialog";
import Pagination from "common/Pagination";
import Table from "common/Table";

import EditEntry from "./EditEntry";
import FilterSideBar from "./FilterSideBar";
// import Header from "./Header";
import './style.scss';

import { TOASTER_DURATION } from "../../../constants/index";

const Devices = ( { isAdminUser, _companyRole, _user, _company } ) => {
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState<boolean>(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>();
  const [editOpen, setEditOpen] = useState<boolean>(false);
  const [isFilterVisible, setFilterVisibilty] = React.useState<boolean>(false);
  const [rememberFilter, setRememberFilter] = useCookies();
  const [deviceData, setDeviceData] = useState<any>([]);
  const [pagy, setPagy] = React.useState<any>(null);
  const [appUrl, setAppUrl] = React.useState<any>({ androidAppUrl: null, iosAppUrl: null });
  const [searchParams, setSearchParams] = useSearchParams();
  const [params, setParams] = React.useState<any>({
    page: searchParams.get("page") || 1,
    ...(searchParams.get("q[first_name_or_last_name_or_email_cont]") && { ["q[first_name_or_last_name_or_email_cont]"]: searchParams.get("q[first_name_or_last_name_or_email_cont]") }),
    ...(searchParams.get("engagements") && { engagements: searchParams.get("engagements") }),
    ...(searchParams.get("departments") && { departments: searchParams.get("departments") })
  });
  const queryParams = () => new URLSearchParams(params).toString();

  const fetchDevices = () => {
    devicesApi.get(queryParams())
      .then((res) => {
        setDeviceData(res.data.devices);
        setPagy(res.data.pagy);
        setAppUrl({
          androidAppUrl: res.data.androidAppUrl,
          iosAppUrl: res.data.iosAppUrl,
        });
      });
  };

  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
  }, []);

  useEffect(() => {
    fetchDevices();
    setSearchParams(params);
  }, [params.page]);

  const tableHeader = [
    {
      Header: "Name",
      accessor: "col2", // accessor is the "key" in the data
      cssClass: "py-5 px-0"
    },
    {
      Header: "Type",
      accessor: "col3",
      cssClass: "py-5 px-0 text-center"
    },
    {
      Header: "Brand",
      accessor: "col6",
      cssClass: "py-5 px-0 text-center"
    },
    {
      Header: "Manufacturer",
      accessor: "col7",
      cssClass: "py-5 px-0 text-center"
    },
    {
      Header: "OS",
      accessor: "col8",
      cssClass: "py-5 px-0 text-center"
    },
    {
      Header: "Version",
      accessor: "col9",
      cssClass: "py-5 px-0 text-center"
    },
    {
      Header: "Availability",
      accessor: "col10",
      cssClass: "py-5 px-0 text-center"
    },
    {
      Header: "Assignee",
      accessor: "col11",
      cssClass: "py-5 px-0 text-center"
    },
    {
      Header: "Device Request",
      accessor: "col12",
      cssClass: "py-5 px-0 text-center"
    },
  ];

  const handleDeleteIconClick = (id: any) => {
    if (!id) return;
    setConfirmOpen(true);
    setSelectedDeviceId(id);
  }

  const handleDelete = async () => {
    const res = await devicesApi.destroy(selectedDeviceId);
    if (!(res.status === 200)) return;
    const newValue = [...deviceData].filter((e: any) => e.id !== selectedDeviceId);
    setDeviceData(newValue);
    setConfirmOpen(false);
    setSelectedDeviceId(undefined);
  }

  const handleEditIconClick = (id: any) => {
    if (!id) return;
    setEditOpen(true);
    setSelectedDeviceId(id);
  }

  const handleDeviceRequest = async (deviceId: number) => {
    if (!deviceId) return;
    const res = await devicesApi.demand(deviceId);
    if (!(res.status === 200)) return;
    fetchDevices();
  }

  const handleCancelRequestIconClick = (id: any) => {
    if (!id) return;
    setCancelConfirmOpen(true);
    setSelectedDeviceId(id);
  }

  const handleCancelRequest = async () => {
    const res = await devicesApi.demandCancel(parseInt(selectedDeviceId));
    if (!(res.status === 200)) return;
    fetchDevices();
    setCancelConfirmOpen(false);
    setSelectedDeviceId(undefined);
  }

  const isAvailable = <p><span className="px-1 text-xs font-semibold tracking-widest uppercase rounded-xl bg-miru-alert-pink-400 text-miru-alert-red-1000">Free</span></p>;
  const isNotAvailable = <p><span className="px-1 text-xs font-semibold tracking-widest uppercase rounded-xl bg-miru-alert-green-400 text-miru-alert-green-800">In Use</span></p>;

  const getTableData = (devices: any) => {
    if (!devices) return [{}];
    return devices.map((device: any) =>
      ({
        // col1: <div className="text-xs tracking-widest text-center">{device.userName}</div>,
        col2: <div className="text-xs tracking-widest">{device.name}</div>,
        col3: <div className="text-xs tracking-widest text-center">{device.deviceType?.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())}</div>,
        // col4: <div className="text-xs tracking-widest text-center">{device.serialNumber}</div>,
        // col5: <div className="text-xs tracking-widest text-center">{device.specifications && Object.entries(device.specifications)?.map(([key, val]: any) => <div key={key + val}><span>{key.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())}:</span><span>{val}</span></div>)}</div>,
        col6: <div className="text-xs tracking-widest text-center">{device.brand}</div>,
        col7: <div className="text-xs tracking-widest text-center">{device.manufacturer}</div>,
        col8: <div className="text-xs tracking-widest text-center">{device.baseOs}</div>,
        col9: <div className="text-xs tracking-widest text-center">{device.version}</div>,
        col10: <div className="text-xs tracking-widest text-center">{device.available ? isAvailable : isNotAvailable }</div>,
        col11: <div className="text-xs tracking-widest text-center">{device.assigneeName}</div>,
        col12: <div className="text-xs tracking-widest text-center">
          <div className="inline-flex rounded-md shadow-sm">{
            device.hideDemand ?
              <p>
                <span className="px-1 text-xs font-semibold tracking-widest uppercase rounded-xl bg-miru-han-purple-100 text-miru-han-purple-1000 inline-block align-middle">Pending</span>
                <button title="Request Cancel" className="ml-2 inline-block align-middle text-miru-alert-pink-400" onClick={() => handleCancelRequestIconClick(device.id)}><XCircle size={25} /></button>
              </p>
              : <button title="Request Device" onClick={() => handleDeviceRequest(device.id)}><PaperPlaneTilt size={25} /></button>}
          {device.devicesDemands && <div className="px-1 py-1 text-sm font-medium">
            <ReactTooltip id={`deviceRequestTip-${device.id}`} effect="solid" backgroundColor="grey" textColor="white" place="top">
              <p className="text-xs">Requested by,</p>
              <ul>
                {
                  device.devicesDemands.map((demand) => <li key={demand.createdAt}>
                    <b>{demand.userName}</b> at <b>{demand.createdAt}</b>
                  </li>)
                }
              </ul>
            </ReactTooltip>
            <CircleWavyWarning size={20} data-tip data-for={`deviceRequestTip-${device.id}`} />
          </div>}
          </div>
        </div>,
        rowId: device.id
      })
    );
  };

  return (
    <>
      <ToastContainer autoClose={TOASTER_DURATION} />
      {/* <Header
        setFilterVisibilty={setFilterVisibilty}
        setDeviceData={setDeviceData}
        setPagy={setPagy}
        params={params}
        setParams={setParams}
      /> */}
      <div
        className={
          "sm:flex mt-6 mb-3 sm:items-center sm:justify-between"
        }>
        <span className="inline-block">
          {/* <h2 className="header__title">Devices</h2> */}
          <span className="inline-block align-middle">Download Apps :</span>
          { appUrl.androidAppUrl && <a href={ appUrl.androidAppUrl } target="_blank" className="inline-block align-middle text-col-han-app-1000" rel="noreferrer">
            <GooglePlayLogo className="m-2" size={30} />
          </a>}
          { appUrl.iosAppUrl && <a href={ appUrl.iosAppUrl } target="_blank" className="inline-block align-middle text-col-han-app-1000" rel="noreferrer">
            <AppStoreLogo className="m-2" size={30} />
          </a>}
        </span>
      </div>
      <div>
        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden">
                {deviceData && <Table
                  hasRowIcons={isAdminUser}
                  tableHeader={tableHeader}
                  tableRowArray={getTableData(deviceData)}
                  hasDeleteAction={true}
                  hasEditAction={true}
                  handleDeleteClick={(id: any) => handleDeleteIconClick(id)}
                  handleEditClick={(id: any) => handleEditIconClick(id)}
                />}
                {deviceData && deviceData.length && (
                  <Pagination pagy={pagy} params={params} setParams={setParams} forPage="devices" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {isFilterVisible && (
        <FilterSideBar setDeviceData={setDeviceData} setFilterVisibilty={setFilterVisibilty} rememberFilter={rememberFilter} setRememberFilter={setRememberFilter} setPagy={setPagy} params={params} setParams={setParams} />
      )}
      <ConfirmDialog
        title="Remove the device?"
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
      >
        Are you sure you want to remove the device <b>
          {{ ...deviceData.find((e: any) => e.id === selectedDeviceId) }['name']}
        </b>?
        This action cannot be reversed.
      </ConfirmDialog>
      {editOpen &&
        <EditEntry
          setClose={setEditOpen}
          setSelectedDeviceId={setSelectedDeviceId}
          selectedDeviceId={selectedDeviceId}
          fetchDevices={fetchDevices}
          deviceData={{ ...deviceData.find((e: any) => e.id === selectedDeviceId) }}
        />
      }
      <ConfirmDialog
        title="Remove the device request?"
        open={cancelConfirmOpen}
        onClose={() => {
          setCancelConfirmOpen(false);
          setSelectedDeviceId(undefined);
        }}
        onConfirm={handleCancelRequest}
      >
        Are you sure you want to remove the device
        Are you sure you want to remove the device <b>
          {{ ...deviceData.find((e: any) => e.id === selectedDeviceId) }['name']}
        </b> request?
        This action cannot be reversed.
      </ConfirmDialog>
    </>
  );
};

export default Devices;
