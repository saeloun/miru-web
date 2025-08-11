 

import React, { Fragment, useEffect, useState } from "react";

import WorkspaceApi from "apis/workspaces";
import Loader from "common/Loader/index";
import withLayout from "common/Mobile/HOC/withLayout";
import { useUserContext } from "context/UserContext";
import { Outlet, useNavigate } from "react-router-dom";

import List from "./List";
import UserInformation from "./UserInformation";

import { SETTINGS } from "../routes";

const MobileNav = () => {
  const { companyRole, isDesktop, user, isAdminUser } = useUserContext();
  const navigate = useNavigate();
  const [currentWorkspace, setCurrentWorkspace] = useState<any>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const personalSettings = SETTINGS.filter(
    ({ category }) => category === "personal"
  );

  const organizationalSettings = SETTINGS.filter(
    ({ category }) => category === "organization"
  );

  const getCurrentWorkspace = async () => {
    const res = await WorkspaceApi.get();
    const { workspaces } = res.data;
    workspaces.find(wrk => {
      if (wrk.id == user.current_workspace_id) {
        setCurrentWorkspace(wrk);
      }
    });
    setIsLoading(false);
  };

  const renderSection = (title, settingsList) => (
    <Fragment>
      <div className="py-3 px-5">
        <span className="text-base font-bold">{title}</span>
      </div>
      <List companyRole={companyRole} settingsList={settingsList} />
    </Fragment>
  );

  useEffect(() => {
    setIsLoading(true);
    getCurrentWorkspace();
  }, []);

  useEffect(() => {
    if (isDesktop) {
      navigate("/settings/profile");
    }
  }, [isDesktop]);

  const mobileView = () => (
    <div>
      <UserInformation />
      <div className="list-none min-h-50v text-sm font-medium leading-5 tracking-wider">
        {isAdminUser ? (
          <Fragment>
            {renderSection("Personal", personalSettings)}
            {renderSection(currentWorkspace.name, organizationalSettings)}
          </Fragment>
        ) : (
          <Fragment>{renderSection("Personal", personalSettings)} </Fragment>
        )}
      </div>
      <Outlet />
    </div>
  );

  const DisplayView = withLayout(mobileView, true, true);

  if (isLoading) {
    return (
      <div className="flex h-80v w-full flex-col justify-center">
        <Loader />
      </div>
    );
  }

  return <DisplayView />;
};

export default MobileNav;
