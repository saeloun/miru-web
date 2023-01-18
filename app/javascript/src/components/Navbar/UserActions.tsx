/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useState, useEffect, useRef } from "react";

import { useOutsideClick } from "helpers";
import { SettingIcon, SignOutIcon, Switcher } from "miruIcons";
import { NavLink } from "react-router-dom";
import { Avatar, Tooltip } from "StyledComponents";

import companiesApi from "apis/companies";
import WorkspaceApi from "apis/workspaces";
import { LocalStorageKeys } from "constants/index";

import { activeClassName } from "./utils";

const UserActions = () => {
  const [currentWorkspace, setCurrentWorkspace] = useState<any>({
    name: "",
    logo: "",
  });
  const [workSpaceList, setWorkSpaceList] = useState<any[]>([]);
  const [showWorkSpaceList, setShowWorkSpaceList] = useState<boolean>(false);
  const [showToolTip, setShowToolTip] = useState<boolean>(false);
  const wrapperRef = useRef(null);
  const toolTipRef = useRef(null);

  useEffect(() => {
    fetchWorkspaces();
    fetchCurrentComapny();
  }, []);

  const handleTooltip = () => {
    if (toolTipRef?.current?.offsetWidth < toolTipRef?.current?.scrollWidth) {
      setShowToolTip(true);
    } else {
      setShowToolTip(false);
    }
  };

  useOutsideClick(
    wrapperRef,
    () => setShowWorkSpaceList(false),
    showWorkSpaceList
  );

  const fetchCurrentComapny = async () => {
    const res = await companiesApi.index();
    setCurrentWorkspace(res.data.company_details);
  };

  const fetchWorkspaces = async () => {
    const res = await WorkspaceApi.get();
    setWorkSpaceList(res.data.workspaces);
  };

  const handleSwitch = async id => {
    await WorkspaceApi.update(id);
    setShowWorkSpaceList(false);
    setTimeout(() => window.location.reload(), 600);
  };

  const handleLogout = () => {
    window.localStorage.removeItem(LocalStorageKeys.INVOICE_FILTERS);
  };

  const WorkspaceList = () => (
    <ul
      className="absolute bottom-20 w-full rounded-lg bg-white py-4 lg:shadow-c1"
      ref={wrapperRef}
    >
      <span className="px-4 text-xs font-medium leading-4 tracking-wider text-miru-dark-purple-200">
        SELECT WORKSPACE
      </span>
      {workSpaceList.map(workspace => (
        <li
          className="flex cursor-pointer items-start justify-start py-3 px-4 hover:bg-miru-gray-100"
          key={workspace.id}
          onClick={() => handleSwitch(workspace.id)}
        >
          <Avatar classNameImg="lg:w-6 lg:h-6 mr-4" url={workspace.logo} />
          {workspace.name}
        </li>
      ))}
    </ul>
  );

  return (
    <ul className="w-full px-6">
      <li className="flex  border-b border-miru-gray-100 last:border-b-0 hover:bg-miru-gray-100 md:border-b-0 lg:justify-start lg:px-0">
        <NavLink
          to="/profile/edit"
          className={({ isActive }) =>
            isActive
              ? activeClassName
              : "flex w-full items-start justify-start py-3 hover:bg-miru-gray-100"
          }
        >
          <SettingIcon className="mr-4" size={26} />
          Settings
        </NavLink>
      </li>
      <li
        className="flex items-start justify-start  border-b border-miru-gray-100 last:border-b-0 hover:bg-miru-gray-100 md:border-b-0 lg:px-0"
        onClick={handleLogout}
      >
        <NavLink
          className="flex w-full items-start justify-start py-3 hover:bg-miru-gray-100"
          data-method="delete"
          rel="nofollow"
          to="/users/sign_out"
        >
          <SignOutIcon className="mr-4" size={26} />
          Logout
        </NavLink>
      </li>

      <Tooltip content={currentWorkspace.name} show={showToolTip}>
        <li
          className="flex w-full cursor-pointer items-center justify-between py-4 px-2 text-sm font-bold leading-4 hover:bg-miru-gray-100 md:px-6"
          onClick={() => {
            setShowWorkSpaceList(true);
          }}
        >
          <div
            className="overflow-hidden truncate whitespace-nowrap lg:pr-4"
            ref={toolTipRef}
            onMouseEnter={handleTooltip}
          >
            <Avatar
              classNameImg="lg:w-6 lg:h-6 lg:mr-4"
              url={currentWorkspace.logo}
            />
            <span>{currentWorkspace.name}</span>
          </div>
          <img className="w-1/4 lg:h-10 lg:w-10" src={Switcher} />
        </li>
      </Tooltip>
      {showWorkSpaceList && <WorkspaceList />}
    </ul>
  );
};

export default UserActions;
