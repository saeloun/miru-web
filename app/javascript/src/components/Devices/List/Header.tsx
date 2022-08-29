/* eslint-disable @typescript-eslint/no-var-requires */
import * as React from "react";
import devices from "apis/devices";
import { Funnel } from "phosphor-react";
import Search from "./Search";

const Header = ({
  setFilterVisibilty,
  setDeviceData,
  setPagy,
  params,
  setParams,
}) => {

  const searchCallBack = (searchString: string) => {
    const updatedParams = { ...params };
    delete updatedParams["q[first_name_or_last_name_or_email_cont]"];
    const queryString = {
      page: 1,
      ...(searchString && { ["q[first_name_or_last_name_or_email_cont]"]: searchString })
    };
    const searchParamWithOthers = { ...updatedParams, ...queryString };
    setParams(searchParamWithOthers);
    devices.get(new URLSearchParams(searchParamWithOthers).toString())
      .then((res) => {
        setDeviceData(res.data.devices);
        setPagy(res.data.pagy);
      });
  };

  return (
    <div
      className={
        "sm:flex mt-6 mb-3 sm:items-center sm:justify-between"
      }>
      <span className="inline-flex">
        <h2 className="header__title">Resource Devices</h2>
      </span>
      <div className="header__searchWrap">
        <div className="header__searchInnerWrapper">
          <Search searchCallBack={searchCallBack} />
        </div>
        <button className="ml-7" onClick={() => setFilterVisibilty(true)}>
          <Funnel size={16} />
        </button>
      </div>
      <div className="flex"></div>
      <div className="flex"></div>
    </div>
  );
};

export default Header;
