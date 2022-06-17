import React, { Fragment, useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import { ListContext } from "context/TeamContext";
import { unmapList } from "mapper/team.mapper";
import Header from "./Header";
import Table from "./Table";
import { TOASTER_DURATION } from "../../../constants/index";
import Modals from "../modals/Modals";
import { get } from "apis/team";

export const ProjectList = () => {

  const [teamList, setTeamList] = useState([]);
  const [modal, setModal] = useState("");

  const setModalState = (modalName) => {
    setModal(modalName);
  };

  const getTeamList = async () => {
    const response = await get();
    if (response.status === 200) {
      const sanitized = unmapList(response)
      setTeamList(sanitized);
    }
  }

  useEffect(() => {
    getTeamList()
  }, []);

  return (
    <Fragment>
      <ListContext.Provider value={{
        teamList,
        setModalState,
        modal
      }}>
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
        <Modals />
      </ListContext.Provider>
    </Fragment>
  );
};
export default ProjectList;
