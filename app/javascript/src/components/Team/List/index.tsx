import React, { useEffect, useState } from "react";

import { ToastContainer } from "react-toastify";

import teamApi from "apis/team";
import { TeamModalType, TOASTER_DURATION } from "constants/index";
import { ListContext } from "context/TeamContext";
import { unmapList } from "mapper/team.mapper";

import Header from "./Header";
import Table from "./Table";

import Modals from "../modals/Modals";

export const ProjectList = () => {
  const [teamList, setTeamList] = useState([]);
  const [modal, setModal] = useState("");
  const [modalUser, setModalUser] = useState({});

  const setModalState = (modalName, user = {}) => {
    setModalUser(user);
    setModal(modalName);
  };

  const getTeamList = async () => {
    const response = await teamApi.get();
    if (response.status === 200) {
      const sanitized = unmapList(response);
      setTeamList(sanitized);
    }
  };

  useEffect(() => {
    if (modal == TeamModalType.NONE) {
      getTeamList();
    }
  }, [modal]);

  return (
    <ListContext.Provider
      value={{
        teamList,
        setModalState,
        modal,
      }}
    >
      <ToastContainer autoClose={TOASTER_DURATION} />
      <Header />
      <div>
        <div className="table__flex">
          <div className="table__position-one">
            <div className="table__position-two">
              <div className="table__border border-b-0 border-miru-gray-200">
                <Table />
              </div>
            </div>
          </div>
        </div>
      </div>
      <Modals user={modalUser} />
    </ListContext.Provider>
  );
};
export default ProjectList;
