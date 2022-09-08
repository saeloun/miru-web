import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import candidates from "apis/candidates";

import Table from "common/Table";

import Header from "./Header";
import { TOASTER_DURATION } from "../../../constants/index";
import { unmapCandidateList } from "../../../mapper/candidate.mapper";
import DeleteCandidate from "../Modals/DeleteCandidate";
import EditCandidate from "../Modals/EditCandidate";
import NewCandidate from "../Modals/NewCandidate";

const getTableData = (candidates) => {
  if (candidates) {
    return candidates.map((candidate) =>
      ({
        col1: <div className="text-base text-miru-dark-purple-1000">{candidate.first_name}</div>,
        col2: <div className="text-base text-center text-miru-dark-purple-1000">{candidate.last_name}</div>,
        col3: <div className="text-base text-center text-miru-dark-purple-1000">{candidate.email}</div>,
        col4: <div className="text-base text-center text-miru-dark-purple-1000">{candidate.consultancy_id}</div>,
        rowId: candidate.id
      })
    );
  }
  return [{}];
};

const CandidateList = ({ isAdminUser, basePath="" }) => {
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [newCandidate, setnewCandidate] = useState<boolean>(false);
  const [candidateToEdit, setedit] = useState({});
  const [candidateToDelete, setDelete] = useState({});
  const [candidateData, setCandidateData] = useState<any>();
  const navigate = useNavigate();

  const handleEditClick = (id) => {
    setShowEditDialog(true);
    const editSelection = candidateData.find(candidate => candidate.id === id);
    setedit(editSelection);
  };

  const handleDeleteClick = (id) => {
    setShowDeleteDialog(true);
    const editSelection = candidateData.find(candidate => candidate.id === id);
    setDelete(editSelection);
  };

  const handleRowClick = (id) => {
    navigate(`${basePath}/${id}`);
  };

  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
    candidates.get("")
      .then((res) => {
        const sanitized = unmapCandidateList(res);
        setCandidateData(sanitized.recruitmentCandidate);
        // setTotalMinutes(sanitized.totalMinutes);
        // setOverDueOutstandingAmt(sanitized.overdueOutstandingAmount);
      });
  }, []);

  const tableHeader = [
    {
      Header: "First Name",
      accessor: "col1", // accessor is the "key" in the data
      cssClass: ""
    },
    {
      Header: "Last Name",
      accessor: "col2",
      cssClass: "text-center"
    },
    {
      Header: "Email",
      accessor: "col3",
      cssClass: "text-center"
    },
    {
      Header: "Consultancy",
      accessor: "col4",
      cssClass: "text-center"
    }
  ];

  const tableData = getTableData(candidateData);

  return (
    <>
      <ToastContainer autoClose={TOASTER_DURATION} />
      <Header isAdminUser={isAdminUser} setnewCandidate={setnewCandidate} />
      <div>
        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden">
                {candidateData && <Table
                  handleEditClick={handleEditClick}
                  handleDeleteClick={handleDeleteClick}
                  hasRowIcons={isAdminUser}
                  tableHeader={tableHeader}
                  tableRowArray={tableData}
                  rowOnClick={isAdminUser ? handleRowClick : () => { }}// eslint-disable-line
                />}
              </div>
            </div>
          </div>
        </div>
      </div>
      {showEditDialog &&
        <EditCandidate
          setShowEditDialog={setShowEditDialog}
          candidate={candidateToEdit}
        />
      }
      {showDeleteDialog && (
        <DeleteCandidate
          setShowDeleteDialog={setShowDeleteDialog}
          candidate={candidateToDelete}
          basePath={basePath}
        />
      )}
      {newCandidate && (
        <NewCandidate
          setnewCandidate={setnewCandidate}
          setCandidateData={setCandidateData}
          candidateData={candidateData}
        />
      )}
    </>

  );
};

export default CandidateList;
