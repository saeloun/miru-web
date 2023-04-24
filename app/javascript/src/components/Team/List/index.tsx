import React, { useEffect, useState } from "react";

import { ToastContainer } from "react-toastify";

import teamApi from "apis/team";
import withLayout from "common/Mobile/HOC/withLayout";
import { TeamModalType, TOASTER_DURATION } from "constants/index";
import { ListContext } from "context/TeamContext";
import { useUserContext } from "context/UserContext";
import { unmapList } from "mapper/team.mapper";

import Header from "./Header";
import Table from "./Table";

import Modals from "../modals/Modals";

const TeamList = () => {
  const [teamList, setTeamList] = useState([]);
  const [modal, setModal] = useState("");
  const [modalUser, setModalUser] = useState({});

  const { isDesktop } = useUserContext();

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

  const TeamLayout = () => (
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
        <div className="table__flex pb-14">
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

  const Main = withLayout(TeamLayout, !isDesktop, !isDesktop);

  return isDesktop ? TeamLayout() : <Main />;
};

export default TeamList;
