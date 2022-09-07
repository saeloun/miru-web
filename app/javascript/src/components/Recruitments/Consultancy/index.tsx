import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import consultancies from "apis/consultancies";

import Table from "common/Table";

import Header from "./Header";
import { TOASTER_DURATION } from "../../../constants/index";
import { unmapConsultancyList } from "../../../mapper/consultancy.mapper";
import DeleteConsultancy from "../Modals/DeleteConsultancy";
import EditConsultancy from "../Modals/EditConsultancy";
import NewConsultancy from "../Modals/NewConsultancy";

const getTableData = (consultancies) => {
  if (consultancies) {
    return consultancies.map((consultancy) =>
      ({
        col1: <div className="text-base text-miru-dark-purple-1000">{consultancy.name}</div>,
        col2: <div className="text-base text-center text-miru-dark-purple-1000">{consultancy.email}</div>,
        col3: <div className="text-base text-center text-miru-dark-purple-1000">{consultancy.address}</div>,
        col4: <div className="text-base text-center text-miru-dark-purple-1000">{consultancy.phone}</div>,
        rowId: consultancy.id
      })
    );
  }
  return [{}];
};

const ConsultancyList = ({ isAdminUser, basePath="" }) => {
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [newConsultancy, setnewConsultancy] = useState<boolean>(false);
  const [consultancyToEdit, setedit] = useState({});
  const [consultancyToDelete, setDelete] = useState({});
  const [consultancyData, setConsultancyData] = useState<any>();
  const navigate = useNavigate();

  const handleEditClick = (id) => {
    setShowEditDialog(true);
    const editSelection = consultancyData.find(consultancy => consultancy.id === id);
    setedit(editSelection);
  };

  const handleDeleteClick = (id) => {
    setShowDeleteDialog(true);
    const editSelection = consultancyData.find(consultancy => consultancy.id === id);
    setDelete(editSelection);
  };

  const handleRowClick = (id) => {
    navigate(`${basePath}/${id}`);
  };

  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
    consultancies.get("")
      .then((res) => {
        const sanitized = unmapConsultancyList(res);
        setConsultancyData(sanitized.recruitmentConsultancy);
        // setTotalMinutes(sanitized.totalMinutes);
        // setOverDueOutstandingAmt(sanitized.overdueOutstandingAmount);
      });
  }, []);

  const tableHeader = [
    {
      Header: "Consultancy",
      accessor: "col1", // accessor is the "key" in the data
      cssClass: ""
    },
    {
      Header: "Email",
      accessor: "col2",
      cssClass: "text-center"
    },
    {
      Header: "Address",
      accessor: "col3",
      cssClass: "text-center"
    },
    {
      Header: "Phone",
      accessor: "col4",
      cssClass: "text-center"
    }
  ];

  const tableData = getTableData(consultancyData);

  return (
    <>
      <ToastContainer autoClose={TOASTER_DURATION} />
      <Header isAdminUser={isAdminUser} setnewConsultancy={setnewConsultancy} />
      <div>
        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden">
                {consultancyData && <Table
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
        <EditConsultancy
          setShowEditDialog={setShowEditDialog}
          consultancy={consultancyToEdit}
        />
      }
      {showDeleteDialog && (
        <DeleteConsultancy
          setShowDeleteDialog={setShowDeleteDialog}
          consultancy={consultancyToDelete}
        />
      )}
      {newConsultancy && (
        <NewConsultancy
          setnewConsultancy={setnewConsultancy}
          setConsultancyData={setConsultancyData}
          consultancyData={consultancyData}
        />
      )}
    </>

  );
};

export default ConsultancyList;
