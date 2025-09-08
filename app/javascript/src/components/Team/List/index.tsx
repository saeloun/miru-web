import { TeamModalType } from "constants/index";

import React, { useEffect, useState } from "react";

import { teamApi } from "apis/api";
import Loader from "common/Loader/index";
import withLayout from "common/Mobile/HOC/withLayout";
import { ListContext } from "context/TeamContext";
import { useUserContext } from "context/UserContext";
import Logger from "js-logger";
import { unmapList, unmapPagyData } from "mapper/team.mapper";
import { Pagination } from "StyledComponents";

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
    getTeamList();
  }, []);

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
        setTeamList,
      }}
    >
      {!hideContainer && (
        <div className="p-4 lg:p-0">
          <Header />
          <div>
            <Table />
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
        </div>
      )}
      <Modals user={modalUser} />
    </ListContext.Provider>
  );

  const Main = withLayout(TeamLayout, !hideContainer, !hideContainer);

  return isDesktop ? TeamLayout() : <Main />;
};

export default TeamList;
