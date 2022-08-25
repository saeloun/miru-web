/* eslint-disable @typescript-eslint/no-var-requires */

import React, { useEffect, useState } from "react";

import profileApi from "apis/profile";
import teamMemberApi from "apis/team-members";
import { Divider } from "common/Divider";
import Loader from "common/Loader/index";
// import * as Yup from "yup";

import Header from "../Header";

const TeamMemberDetails = () => {
  // const [teamMemberIds, setTeamMemberIds] = useState([]);
  const [isLoading, setisLoading] = useState(false);

  const userData = await profileApi.index();

  const getData = async () => {
    setisLoading(true);
    const data = await teamMemberApi.get(userData.data.user.id);
    setTeamMemberIds(data.data.user.first_name);
    setisLoading(false);
  };

  useEffect(() => {
    getData();
  }, []);

  return (
    <div className="flex flex-col w-4/5">
      <Header
        title={"Team Members"}
        subTitle={"View and manage team members"}
        showButtons={true}
        cancelAction={handleCancelAction}
        saveAction={handleUpdateProfile}
        isDisableUpdateBtn={isDetailUpdated}
      />
      {isLoading ? <Loader /> : (
        <div className="pb-10 pt-10 pl-10 pr-10 mt-4 bg-miru-gray-100 min-h-80v">
          <div className="flex flex-row py-6">
            <div className="w-4/12 font-bold p-2">Team Members</div>
            <div className="w-full p-2">
            </div>
          </div>
          <Divider />
        </div>
      )}
    </div>
  );
};

export default TeamMemberDetails;