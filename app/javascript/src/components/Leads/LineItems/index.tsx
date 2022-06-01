import React, { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import { setAuthHeaders } from "apis/axios";
import leadLineItems from "apis/lead-line-items";

import Table from "common/Table";

import DeleteLineItem from "./../Modals/DeleteLineItem";
import EditLineItem from "./../Modals/EditLineItem";
import NewLineItem from "./../Modals/NewLineItem";
import Header from "./Header";
import { TOASTER_DURATION } from "../../../constants/index";
import { unmapLeadLineItemList } from "../../../mapper/lead.lineItem.mapper";

const getTableData = (lineItems) => {
  if (lineItems) {
    return lineItems.map((item) =>
      ({
        col1: <div className="text-base text-miru-dark-purple-1000">{item.name}</div>,
        col2: <div className="text-base text-miru-dark-purple-1000">{item.description}</div>,
        col3: <div className="text-base text-miru-dark-purple-1000">{item.kind}</div>,
        col4: <div className="text-base text-miru-dark-purple-1000">{item.number_of_resource}</div>,
        col5: <div className="text-base text-miru-dark-purple-1000">{item.resource_expertise_level}</div>,
        col6: <div className="text-base text-miru-dark-purple-1000">{item.price}</div>,
        rowId: item.id
      })
    );
  }
  return [{}];
};

const LineItems = ({ leadDetails }) => {
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [newLead, setnewLead] = useState<boolean>(false);
  const [leadToEdit, setEdit] = useState({});
  const [leadToDelete, setDelete] = useState({});
  const [leadData, setLeadData] = useState<any>();

  const handleEditClick = (id) => {
    setShowEditDialog(true);
    const editSelection = leadData.find(i => i.id === id);
    setEdit(editSelection);
  };

  const handleDeleteClick = (id) => {
    setShowDeleteDialog(true);
    const editSelection = leadData.find(i => i.id === id);
    setDelete(editSelection);
  };

  useEffect(() => {
    setAuthHeaders();
    if (leadDetails && leadDetails.id) {
      leadLineItems.index(leadDetails.id)
        .then((res) => {
          const sanitized = unmapLeadLineItemList(res);
          setLeadData(sanitized.itemList);
        });
    }
  }, [leadDetails.id]);

  const tableHeader = [
    {
      Header: "ITEM",
      accessor: "col1", // accessor is the "key" in the data
      cssClass: ""
    },
    {
      Header: "Description",
      accessor: "col2",
      cssClass: "text-right"
    },
    {
      Header: "Kind",
      accessor: "col3",
      cssClass: "text-right"
    },
    {
      Header: "Number of resource",
      accessor: "col4",
      cssClass: "text-right"
    },
    {
      Header: "Resource Expertise Level",
      accessor: "col5",
      cssClass: "text-right"
    },
    {
      Header: "Quality",
      accessor: "col6",
      cssClass: "text-right"
    },
    {
      Header: "Price",
      accessor: "col7",
      cssClass: "text-right"
    },
  ];

  const tableData = getTableData(leadData);

  return (
    <>
      <ToastContainer autoClose={TOASTER_DURATION} />
      <Header isAdminUser={true} setnewLead={setnewLead} />
      <div>
        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="overflow-hidden">
                {leadData && <Table
                  handleEditClick={handleEditClick}
                  handleDeleteClick={handleDeleteClick}
                  hasRowIcons={true}
                  tableHeader={tableHeader}
                  tableRowArray={tableData}
                />}
              </div>
            </div>
          </div>
        </div>
      </div>
      {showEditDialog &&
        <EditLineItem
          leadDetails={leadDetails}
          item={leadToEdit}
          setShowEditDialog={setShowEditDialog}
        />
      }
      {showDeleteDialog && (
        <DeleteLineItem
          leadDetails={leadDetails}
          item={leadToDelete}
          setShowDeleteDialog={setShowDeleteDialog}
        />
      )}
      {newLead && (
        <NewLineItem
          leadDetails={leadDetails}
          leadData={leadData}
          setnewLead={setnewLead}
          setLeadData={setLeadData}
        />
      )}
    </>
  );
};

export default LineItems;
