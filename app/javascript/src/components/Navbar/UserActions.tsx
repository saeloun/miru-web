import React, { useState, useEffect, useRef } from "react";

import WorkspaceApi from "apis/workspaces";
import { Paths } from "constants/index";
import { useUserContext } from "context/UserContext";
import { useOutsideClick } from "helpers";
import { SettingIcon, SignOutIcon, Switcher } from "miruIcons";
import { NavLink } from "react-router-dom";
import { Avatar, Tooltip } from "StyledComponents";

import { activeClassName, handleLogout } from "./utils";

const UserActions = setVisiblity => {
  const [currentWorkspace, setCurrentWorkspace] = useState<any>({
    name: "",
    logo: "",
  });
  const [workSpaceList, setWorkSpaceList] = useState<any[]>([]);
  const [showWorkSpaceList, setShowWorkSpaceList] = useState<boolean>(false);
  const [showToolTip, setShowToolTip] = useState<boolean>(false);
  const wrapperRef = useRef(null);
  const toolTipRef = useRef(null);

  const { user } = useUserContext();
  const { isDesktop } = useUserContext();

  useEffect(() => {
    fetchWorkspaces();
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

  const fetchWorkspaces = async () => {
    const res = await WorkspaceApi.get();
    const { workspaces } = res.data;
    setWorkSpaceList(workspaces);
    workspaces.find(wrk => {
      if (wrk.id == user.current_workspace_id) {
        setCurrentWorkspace(wrk);
      }
    });
  };

  const handleSwitch = async id => {
    await WorkspaceApi.update(id);
    setShowWorkSpaceList(false);
    setTimeout(() => window.location.reload(), 600);
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
          <Avatar
            classNameImg="mr-5"
            classNameInitials="lg:text-xs font-bold capitalize text-white"
            classNameInitialsWrapper="lg:mr-5 bg-miru-gray-1000 "
            initialsLetterCount={1}
            name={workspace.name}
            size="w-6 h-6"
            url={workspace.logo}
          />
          {workspace.name}
        </li>
      ))}
    </ul>
  );

  return (
    <ul className="w-full lg:mb-2 xl:mb-6">
      <li className="flex border-b border-miru-gray-100 last:border-b-0 hover:bg-miru-gray-100 lg:justify-start lg:border-b-0">
        <NavLink
          to={
            isDesktop
              ? Paths.SETTINGS.replace("/*", "/profile")
              : Paths.SETTINGS.replace("/*", "")
          }
          className={({ isActive }) =>
            isActive
              ? activeClassName
              : "flex w-full items-start justify-start py-3 px-6 hover:bg-miru-gray-100"
          }
          onClick={() => {
            if (!isDesktop) {
              setVisiblity(false);
            }
          }}
        >
          <SettingIcon className="mr-4" size={26} />
          Settings
        </NavLink>
      </li>
      <li
        className="flex cursor-pointer border-b border-miru-gray-100 px-6 py-3 last:border-b-0 hover:bg-miru-gray-100 lg:justify-start lg:border-b-0"
        id="logoutBtn"
        onClick={() => handleLogout()}
      >
        <SignOutIcon className="mr-4" size={26} />
        Logout
      </li>
      <Tooltip content={currentWorkspace.name} show={showToolTip}>
        <li
          className="flex w-full cursor-pointer items-center justify-between py-3  px-6 text-sm font-bold leading-4 hover:bg-miru-gray-100"
          onClick={() => {
            if (workSpaceList.length > 1) {
              setShowWorkSpaceList(true);
            }
          }}
        >
          <div
            className="overflow-hidden truncate whitespace-nowrap lg:pr-4"
            ref={toolTipRef}
            onMouseEnter={handleTooltip}
          >
            <Avatar
              classNameImg="mr-5"
              classNameInitials="lg:text-xs font-bold capitalize text-white"
              classNameInitialsWrapper="lg:mr-5 bg-miru-gray-1000 "
              initialsLetterCount={1}
              name={currentWorkspace.name}
              size="w-6 h-6"
              url={currentWorkspace.logo}
            />
            <span>{currentWorkspace.name}</span>
          </div>
          {workSpaceList.length > 1 && (
            <img className="lg:h-10 lg:w-10" src={Switcher} />
          )}
        </li>
      </Tooltip>
      {showWorkSpaceList && <WorkspaceList />}
    </ul>
  );
};

export default UserActions;
