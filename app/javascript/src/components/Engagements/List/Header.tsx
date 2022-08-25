/* eslint-disable @typescript-eslint/no-var-requires */
import * as React from "react";
import engagements from "apis/engagements";
import { Funnel } from "phosphor-react";
import Search from "./Search";
import { unmapEngagementList } from "../../../mapper/engagement.mapper";

const Header = ({
  isAdminUser,
  setFilterVisibilty,
  setEngagementData,
  setPagy,
}) => {

  const searchCallBack = async (searchString: string) => {
    await engagements.get(new URLSearchParams(searchString).toString())
      .then((res) => {
        const sanitized = unmapEngagementList(res);
        setEngagementData(sanitized.list);
        setPagy(res.data.pagy);
      });
  };

  return (
    <div
      className={
        isAdminUser
          ? "sm:flex mt-6 mb-3 sm:items-center sm:justify-between"
          : "sm:flex mt-6 mb-3 sm:items-center"
      }>
      <span className="inline-flex">
        <h2 className="header__title">Resource Engagement</h2>
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
