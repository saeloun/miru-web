import React, { useEffect, useState } from "react";
import devicesApi from "apis/devices";
import devicesItemsApi from 'apis/devices-items';

interface ISelectOptions {
  id: string | number;
  name: string;
}

interface IEditEntryProps {
  className?: string;
  setClose: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedDeviceId: React.Dispatch<React.SetStateAction<string|undefined>>;
  selectedDeviceId?: string;
  fetchDevices: () => void;
  deviceData: any;
}

const EditEntry: React.FC<IEditEntryProps> = ({
  className='',
  setClose,
  setSelectedDeviceId,
  selectedDeviceId,
  fetchDevices,
  deviceData,
}) => {
  const [deviceTypeOptions, setDeviceTypeOptions] = useState<Array<ISelectOptions> | undefined>([]);
  const [assigneeIdOptions, setAssigneeIdOptions] = useState<Array<ISelectOptions> | undefined>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [deviceType, setDeviceType] = useState<string | undefined>(deviceData.deviceType);
  const [deviceName, setDeviceName] = useState<string | undefined>(deviceData.name);
  const [deviceBrand, setDeviceBrand] = useState<string | undefined>(deviceData.brand);
  const [deviceManufacturer, setDeviceManufacturer] = useState<string | undefined>(deviceData.manufacturer);
  const [deviceOS, setDeviceOS] = useState<string | undefined>(deviceData.baseOs);
  const [deviceVersion, setDeviceVersion] = useState<string | undefined>(deviceData.version);
  const [assigneeId, setAssigneeId] = useState<number | undefined>(deviceData.assigneeId);
  const [deviceIsAvailable, setDeviceIsAvailable] = useState<boolean>(deviceData.available);
  const [serialNumber, setSerialNumber] = useState<string | undefined>(deviceData.serialNumber);
  const [deviceVersionId, setDeviceVersionId] = useState<string | undefined>(deviceData.versionId);
  const isAvailable = <span className="px-1 text-xs font-semibold tracking-widest uppercase rounded-xl bg-miru-alert-pink-400 text-miru-alert-red-1000">Free</span>;
  const isNotAvailable = <span className="px-1 text-xs font-semibold tracking-widest uppercase rounded-xl bg-miru-alert-green-400 text-miru-alert-green-800">In Use</span>;
  const loadingButton = <>
    <svg
      className="inline-block w-5 h-5 mr-3 animate-spin"
      version="1.1"
      id="Capa_1"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 583.162 583.162" xmlSpace="preserve">
      <g>
        <g>
          <polygon points="279.958,255.742 279.958,116.211 163.722,116.211 0.993,255.742 0.993,278.965 256.711,278.965" />
          <polygon points="256.711,304.197 117.228,304.197 117.228,420.409 256.711,583.162 279.958,583.162 279.958,327.42" />
          <polygon points="326.936,278.989 466.418,278.989 466.418,162.754 326.936,0 303.689,0 303.689,255.742"/>
          <polygon points="303.205,327.42 303.205,466.927 419.44,466.927 582.169,327.42 582.169,304.197 326.427,304.197" />
        </g>
      </g>
    </svg>
    Processing...
  </>;

  useEffect(() => {
    devicesItemsApi.get()
      .then((response: any) => {
        setDeviceTypeOptions(response.data.device_type);
        setAssigneeIdOptions(response.data.users);
      }).catch(() => {
        setDeviceTypeOptions([]);
        setAssigneeIdOptions([]);
      });
    return () => {
      setDeviceTypeOptions([]);
      setAssigneeIdOptions([]);
    };
  }, []);

  const getPayload = () => ({
    available: deviceIsAvailable,
    base_os: deviceOS,
    brand: deviceBrand,
    device_type: deviceType,
    manufacturer: deviceManufacturer,
    name: deviceName,
    version: deviceVersion,
    assignee_id: assigneeId,
    serial_number: serialNumber,
    version_id: deviceVersionId,
  });

  const handleEdit = async () => {
    setIsProcessing(true);
    const params = getPayload();
    const res = await devicesApi.update(selectedDeviceId, {
      device_params: params
    });

    if (res.status === 200) {
      fetchDevices();
      setIsProcessing(false);
      setSelectedDeviceId(undefined);
      setClose(false);
    }
  }

  return (
    <>
      <span className='fixed top-0 left-0 w-full h-full bg-gray-800 bg-opacity-50' />
      <div aria-hidden="true" className={`fixed top-0 left-0 right-0 z-50 w-full overflow-x-hidden overflow-y-auto md:inset-0 h-modal md:h-full ${className}`}>
        <div className="relative float-right w-full h-full max-w-md md:h-auto">
          <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
            <button
              type="button"
              className="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-800 dark:hover:text-white"
              onClick={() => {
                setSelectedDeviceId(undefined);
                setClose(false);
              }}>
              <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
              <span className="sr-only">Close modal</span>
            </button>
            <div className="w-full p-6" style={{ backgroundColor: "#335CD6" }}>
              <p className="px-6 text-xl font-medium text-white dark:text-white">
                Edit Device Details
              </p>
            </div>
            <div className="px-6 py-6 lg:px-8">
              <div className="space-y-6">
                <div>
                  <label htmlFor="assignee" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Assignee</label>
                  <select
                    disabled={isProcessing}
                    onChange={e => {
                      setAssigneeId(parseInt(e.target.value));
                    }}
                    value={assigneeId || ""}
                    name="assignee_id"
                    id="assignee"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  >
                    {!assigneeId && (
                      <option disabled className="text-miru-gray-100" value="">
                        Please select assignee
                      </option>
                    )}
                    {assigneeIdOptions.map((a: ISelectOptions) => (
                      <option key={`assigneeId-${a.id}`} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Available</label>
                  <div className="mb-3">
                    <span className="font-medium text-gray-400">{isNotAvailable}</span>
                    <div className="relative inline-block w-10 mx-2 align-middle select-none">
                      <input disabled={isProcessing} onChange={() => setDeviceIsAvailable(!deviceIsAvailable)} checked={deviceIsAvailable} type="checkbox" name="available" id="available" className="absolute block w-6 h-6 duration-200 ease-in border-4 rounded-full outline-none appearance-none cursor-pointer bg-miru-alert-red-1000 checked:bg-miru-alert-green-800 focus:outline-none right-4 checked:right-0"/>
                      <label htmlFor="available" className={`block h-6 overflow-hidden rounded-full cursor-pointer ${deviceIsAvailable ? 'bg-miru-alert-green-400' : 'bg-miru-alert-pink-400'}`} />
                    </div>
                    <span className="font-medium text-gray-400">{isAvailable}</span>
                  </div>
                </div>
                <hr></hr>
                <div>
                  <label htmlFor="deviceType" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300 required">Device Type</label>
                  <select
                    disabled={isProcessing}
                    onChange={e => {
                      setDeviceType(e.target.value);
                    }}
                    value={deviceType || ""}
                    name="device_type"
                    id="deviceType"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  >
                    {!deviceType && (
                      <option disabled className="text-miru-gray-100" value="">
                        Please select device type
                      </option>
                    )}
                    {deviceTypeOptions.map((a: ISelectOptions) => (
                      <option key={`deviceType-${a.id}`} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300 required">Device Name</label>
                  <input
                    disabled={isProcessing}
                    onChange={e => {
                      setDeviceName(e.target.value);
                    }}
                    value={deviceName || ""}
                    name="name"
                    id="name"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  />
                </div>
                <div>
                  <label htmlFor="brand" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Brand</label>
                  <input
                    disabled={isProcessing}
                    onChange={e => {
                      setDeviceBrand(e.target.value);
                    }}
                    value={deviceBrand || ""}
                    name="brand"
                    id="brand"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  />
                </div>
                <div>
                  <label htmlFor="manufacturer" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Manufacturer</label>
                  <input
                    disabled={isProcessing}
                    onChange={e => {
                      setDeviceManufacturer(e.target.value);
                    }}
                    value={deviceManufacturer || ""}
                    name="manufacturer"
                    id="manufacturer"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  />
                </div>
                <div>
                  <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Serial Number</label>
                  <input
                    disabled={isProcessing}
                    onChange={e => {
                      setSerialNumber(e.target.value);
                    }}
                    value={serialNumber || ""}
                    name="serialNumber"
                    id="serialNumber"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  />
                </div>
                <hr></hr>
                <div>
                  <label htmlFor="os" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">OS</label>
                  <input
                    disabled={isProcessing}
                    onChange={e => {
                      setDeviceOS(e.target.value);
                    }}
                    value={deviceOS || ""}
                    name="base_os"
                    id="os"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  />
                </div>
                <div>
                  <label htmlFor="version" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Version</label>
                  <input
                    disabled={isProcessing}
                    onChange={e => {
                      setDeviceVersion(e.target.value);
                    }}
                    value={deviceVersion || ""}
                    name="version"
                    id="version"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  />
                </div>

                <div>
                  <label htmlFor="version" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Version ID</label>
                  <input
                    disabled={isProcessing}
                    onChange={e => {
                      setDeviceVersionId(e.target.value);
                    }}
                    value={deviceVersionId || ""}
                    name="versionId"
                    id="versionId"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  />
                </div>
                <button
                  onClick={handleEdit}
                  disabled={!(deviceType && deviceName) || isProcessing}
                  className={
                    `mb-1 h-8 w-full text-xs py-1 px-6 rounded border text-white font-bold tracking-widest bg-miru-han-purple-1000 hover:border-transparent ${!isProcessing ? 'disabled:bg-miru-gray-1000' : 'disabled:bg-miru-han-purple-400'}`
                  }
                >
                  {isProcessing ? loadingButton : 'UPDATE'}
                </button>
                <button
                  onClick={() => {
                    setSelectedDeviceId(undefined);
                    setClose(false);
                  }}
                  className="w-full h-8 px-6 py-1 mt-1 text-xs font-bold tracking-widest bg-transparent border rounded border-miru-han-purple-1000 hover:bg-miru-han-purple-1000 text-miru-han-purple-600 hover:text-white hover:border-transparent"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditEntry;
