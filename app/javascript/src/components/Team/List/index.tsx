import React, { Fragment, useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import { ListContext } from "context/TeamContext";
import { unmapList } from "mapper/team.mapper";
import Header from "./Header";
import Table from "./Table";
import { TOASTER_DURATION } from "../../../constants/index";
import Modals from "../modals/Modals";

const list = [{
  first_name: "Ajinkya",
  last_name: "Deshmukh",
  role: "Admin",
  email: "ajinkya@saeloun.com"
}, {
  first_name: "Ajinkya",
  last_name: "Deshmukh",
  role: "Admin",
  email: "ajinkya@saeloun.com"
},
{
  first_name: "Ajinkya",
  last_name: "Deshmukh",
  role: "Admin",
  email: "ajinkya@saeloun.com"
}];

export const ProjectList = () => {

  const [teamList, setTeamList] = useState([]);
  const [modal, setModal] = useState("");

  const setModalState = (modalName) => {
    setModal(modalName);
  };

  useEffect(() => {
    const sanitizedData = unmapList(list);
    setTeamList(sanitizedData);
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
