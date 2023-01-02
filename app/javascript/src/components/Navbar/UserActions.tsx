/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useState, useEffect, useRef } from "react";

import { SettingIcon, SignOutIcon } from "miruIcons";
import { NavLink } from "react-router-dom";

import companiesApi from "apis/companies";
import WorkspaceApi from "apis/workspaces";

import { activeClassName } from "./utils";

import { useOutsideClick } from "../../helpers/outsideClick";
import Avatar from "../../StyledComponents/Avatar";

const switcher = require("../../../../assets/images/switcher.svg");

const UserActions = () => {
  const [currentWorkspace, setCurrentWorkspace] = useState<any>({
    name: "",
    logo: "",
  });
  const [workSpaceList, setWorkSpaceList] = useState<any[]>([]);
  const [showWorkSpaceList, setShowWorkSpaceList] = useState<boolean>(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    fetchWorkspaces();
    fetchCurrentComapny();
  }, []);

  useOutsideClick(
    wrapperRef,
    () => setShowWorkSpaceList(false),
    showWorkSpaceList
  );

  const WorkspaceList = () => (
    <ul
      className="absolute bottom-20 w-full rounded-lg bg-white p-4 shadow-c1"
      ref={wrapperRef}
    >
      <span className="text-xs font-medium leading-4 tracking-wider text-miru-dark-purple-200">
        SELECT WORKSPACE
      </span>
      {workSpaceList.map(workspace => (
        <li
          className="flex cursor-pointer items-center justify-center py-3 px-2 hover:bg-miru-gray-100 lg:justify-start lg:px-6"
          key={workspace.id}
          onClick={() => handleSwitch(workspace.id)}
        >
          <Avatar classNameImg="lg:w-6 lg:h-6 lg:mr-4" url={workspace.logo} />
          {workspace.name}
        </li>
      ))}
    </ul>
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
    fetchCurrentComapny();
  };

  return (
    <ul className="mt-auto lg:mt-32">
      <li className="flex items-center justify-center hover:bg-miru-gray-100 lg:justify-start">
        <NavLink
          to="/profile/edit"
          className={({ isActive }) =>
            isActive
              ? activeClassName
              : "flex w-full items-center justify-center py-3 px-2 hover:bg-miru-gray-100 lg:justify-start lg:px-6"
          }
        >
          <SettingIcon className="mr-0 lg:mr-4" size={26} />
          Settings
        </NavLink>
      </li>
      <a data-method="delete" href="/users/sign_out" rel="nofollow">
        <li className="flex items-center justify-center py-3 px-2 hover:bg-miru-gray-100 lg:justify-start lg:px-6">
          <SignOutIcon className="mr-0 lg:mr-4" size={26} />
          Logout
        </li>
      </a>
      <li
        className="flex w-full cursor-pointer items-center justify-between py-4 px-2 text-sm font-bold leading-4 hover:bg-miru-gray-100 md:px-6"
        onClick={() => {
          setShowWorkSpaceList(true);
        }}
      >
        <div>
          <Avatar
            classNameImg="lg:w-6 lg:h-6 lg:mr-4"
            url={currentWorkspace.logo}
          />
          <span>{currentWorkspace.name}</span>
        </div>
        <img className="h-10 w-10" src={switcher} />
      </li>
      {showWorkSpaceList && <WorkspaceList />}
    </ul>
  );
};

export default UserActions;
