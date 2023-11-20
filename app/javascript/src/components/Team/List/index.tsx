import React, { Fragment, useEffect, useState } from "react";

import Logger from "js-logger";
import { Pagination } from "StyledComponents";

import teamApi from "apis/team";
import Loader from "common/Loader/index";
import withLayout from "common/Mobile/HOC/withLayout";
import { TeamModalType } from "constants/index";
import { ListContext } from "context/TeamContext";
import { useUserContext } from "context/UserContext";
import { unmapList, unmapPagyData } from "mapper/team.mapper";

import Header from "./Header";
import Table from "./Table";

import Modals from "../modals/Modals";

const TeamList = () => {
  const [teamList, setTeamList] = useState([]);
  const [modal, setModal] = useState("");
  const [modalUser, setModalUser] = useState({});
  const [loading, setLoading] = useState<boolean>(false);
  const [pagy, setPagy] = useState<any>(null);

  const { isDesktop } = useUserContext();

  const hideContainer = modal == TeamModalType.ADD_EDIT && !isDesktop;

  const setModalState = (modalName, user = {}) => {
    setModalUser(user);
    setModal(modalName);
  };

  const getTeamList = async () => {
    setLoading(true);
    try {
      const response = await teamApi.get();
      if (response.status === 200) {
        const sanitized = unmapList(response);
        const pagyData = unmapPagyData(response);
        setTeamList(sanitized);
        setPagy(pagyData);
      }
      setLoading(false);
    } catch (e) {
      Logger.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (modal == TeamModalType.NONE) {
      getTeamList();
    }
  }, [modal]);

  const handlePageChange = async (pageData, items = pagy.items) => {
    if (pageData == "...") return;

    const response = await teamApi.get(`page=${pageData}&items=${items}`);
    if (response.status === 200) {
      const sanitized = unmapList(response);
      const pagyData = unmapPagyData(response);
      setTeamList(sanitized);
      setPagy(pagyData);
    }
  };

  const isFirstPage = () => {
    if (typeof pagy?.first == "boolean") {
      return pagy?.first;
    }

    return pagy?.page == 1;
  };

  const isLastPage = () => {
    if (typeof pagy?.last == "boolean") {
      return pagy?.last;
    }

    return pagy?.last == pagy?.page;
  };

  const handleClickOnPerPage = e => {
    handlePageChange(Number(1), Number(e.target.value));
    setPagy({ ...pagy, items: Number(e.target.value) });
  };

  if (loading) {
    return <Loader />;
  }

  const TeamLayout = () => (
    <ListContext.Provider
      value={{
        teamList,
        setModalState,
        modal,
      }}
    >
      {!hideContainer && (
        <Fragment>
          <Header />
          <div>
            <div className="table__flex pb-14">
              <div className="table__border border-b-0 border-miru-gray-200">
                <Table />
              </div>
            </div>
            <Pagination
              isPerPageVisible
              currentPage={pagy?.page}
              handleClick={handlePageChange}
              handleClickOnPerPage={handleClickOnPerPage}
              isFirstPage={isFirstPage()}
              isLastPage={isLastPage()}
              itemsPerPage={pagy?.items}
              nextPage={pagy?.next}
              prevPage={pagy?.prev}
              title="users/page"
              totalPages={pagy?.pages}
            />
          </div>
        </Fragment>
      )}
      <Modals user={modalUser} />
    </ListContext.Provider>
  );

  const Main = withLayout(TeamLayout, !hideContainer, !hideContainer);

  return isDesktop ? TeamLayout() : <Main />;
};

export default TeamList;
