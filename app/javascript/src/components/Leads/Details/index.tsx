import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import leads from "apis/leads";
import Header from "./Header";
import Tab from "./Tab";
import { TOASTER_DURATION } from "../../../constants/index";
import { unmapLeadDetails } from "../../../mapper/lead.mapper";

const LeadList = () => {
  const [leadDetails, setLeadDetails] = useState<any>({});
  const { leadId } = useParams();

  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
    leads.show(leadId)
      .then((res) => {
        const sanitized = unmapLeadDetails(res);
        setLeadDetails(sanitized.leadDetails);
      });
  }, [leadId]);

  return (
    <>
      <ToastContainer autoClose={TOASTER_DURATION} />
      <Header leadDetails={leadDetails} />
      <Tab leadDetails={leadDetails} />
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
