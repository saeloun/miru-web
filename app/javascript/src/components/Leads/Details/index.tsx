import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import leads from "apis/leads";

// import AmountBoxContainer from "common/AmountBox";
// import ChartBar from "common/ChartBar";
// import Table from "common/Table";
// import { cashFormatter } from "helpers/cashFormater";
// import { currencySymbol } from "helpers/currencySymbol";

import Header from "./Header";
import { TOASTER_DURATION } from "../../../constants/index";
import { unmapLeadDetails } from "../../../mapper/lead.mapper";
// import AddEditProject from "../../Projects/Modals/AddEditProject";
// import DeleteProject from "../../Projects/Modals/DeleteProject";

// const getTableData = (leads) => {
//   if (leads) {
//     return leads.map((lead) => {
//       // const hours = (lead.minutes/60).toFixed(2);
//       ({
//         col1: <div className="text-base text-miru-dark-purple-1000">{lead.name}</div>,
//         col2: <div className="text-base text-miru-dark-purple-1000">{lead.budget_amount}</div>,
//         col3: <div className="text-base text-miru-dark-purple-1000">{lead.budget_status_code}</div>,
//         col4: <div className="text-base text-miru-dark-purple-1000">{lead.industry_code}</div>,
//         col5: <div className="text-base text-miru-dark-purple-1000">{lead.quality_code}</div>,
//         col6: <div className="text-base text-miru-dark-purple-1000">{lead.state_code}</div>,
//         col7: <div className="text-base text-miru-dark-purple-1000">{lead.status_code}</div>,
//         rowId: lead.id
//       })
//     });
//   }
//   return [{}];
// };

const LeadList = () => {
  // const [showEditDialog, setShowEditDialog] = useState<boolean>(false);
  // const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  // const [selectedProject, setSelectedProject] = useState({});
  // const [projectDetails, setProjectDetails] = useState<any>();
  // const [totalMinutes, setTotalMinutes] = useState(null);
  const [leadDetails, setLeadDetails] = useState<any>({});
  // const [editProjectData, setEditProjectData] = React.useState<any>(null);
  // const [overdueOutstandingAmount, setOverDueOutstandingAmt]= useState<any>(null);

  const params = useParams();
  // const handleEditClick = (id) => {
  //   setShowEditDialog(true);
  //   const editSelection = projectDetails.find(project => project.id === id);
  //   setSelectedProject(editSelection);
  // };

  // const handleDeleteClick = (id) => {
  //   setShowDeleteDialog(true);
  //   const editSelection = projectDetails.find(project => project.id === id);
  //   setSelectedProject(editSelection);
  // };

  // const handleSelectChange = (event) => {
  //   leads.show(params.leadId,`?time_frame=${event.target.value}`)
  //     .then((res) => {
  //       const sanitized = unmapLeadDetails(res);
  //       // setProjectDetails(sanitized.projectDetails);
  //       setLeadDetails(sanitized.leadDetails);
  //       // setTotalMinutes(sanitized.totalMinutes);
  //       // setOverDueOutstandingAmt(sanitized.overdueOutstandingAmount);
  //     });
  // };

  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
    leads.show(params.leadId, "?time_frame=week")
      .then((res) => {
        const sanitized = unmapLeadDetails(res);
        setLeadDetails(sanitized.leadDetails);
        // setProjectDetails(sanitized.projectDetails);
        // setTotalMinutes(sanitized.totalMinutes);
        // setOverDueOutstandingAmt(sanitized.overdueOutstandingAmount);
      });
  }, []);

  // const tableHeader = [
  //   {
  //     Header: "Lead",
  //     accessor: "col1", // accessor is the "key" in the data
  //     cssClass: ""
  //   }
  // ];

  // const currencySymb = currencySymbol(overdueOutstandingAmount?.currency);

  // const amountBox = [{
  //   title: "OVERDUE",
  //   amount: currencySymb + cashFormatter(overdueOutstandingAmount?.overdue_amount)
  // },
  // {
  //   title: "OUTSTANDING",
  //   amount: currencySymb + cashFormatter(overdueOutstandingAmount?.outstanding_amount)
  // }];

  // const tableData = getTableData(projectDetails);

  return (
    <>
      <ToastContainer autoClose={TOASTER_DURATION} />
      <Header leadDetails={leadDetails} />
      {/* <div>
        { isAdminUser && <div className="bg-miru-gray-100 py-10 px-10">
          <div className="flex justify-end">
            <select onChange={handleSelectChange} className="px-3
                py-1.5
                text-base
                font-normal
                bg-transparent bg-clip-padding bg-no-repeat
                border-none
                transition
                ease-in-out
                m-0
                focus:outline-none
                text-miru-han-purple-1000">
              <option className="text-miru-dark-purple-600" value="week">
                    THIS WEEK
              </option>
              <option className="text-miru-dark-purple-600" value="month">
                    This MONTH
              </option>
              <option className="text-miru-dark-purple-600" value="year">
                    THIS YEAR
              </option>
            </select>
          </div>
          {projectDetails && <ChartBar data={projectDetails} totalMinutes={totalMinutes} />}
          <AmountBoxContainer amountBox = {amountBox} />
        </div>
        }
        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="overflow-hidden">
                { projectDetails && <Table
                  handleEditClick={handleEditClick}
                  handleDeleteClick={handleDeleteClick}
                  hasRowIcons={true}
                  tableHeader={tableHeader}
                  tableRowArray={tableData}
                /> }
              </div>
            </div>
          </div>
        </div>
      </div>
      {showEditDialog &&
        <AddEditProject
          setShowProjectModal={setShowEditDialog}
          setEditProjectData={setEditProjectData}
          editProjectData={editProjectData}
          projectData={selectedProject}
        />
      }
      {showDeleteDialog && (
        <DeleteProject
          setShowDeleteDialog={setShowDeleteDialog}
          project={selectedProject}
        />
      )} */}
    </>
  );
};

export default LeadList;
