/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
import leadAllowedUsersApi from "apis/lead-allowed-users";
import leadItemsApi from "apis/lead-items";
import leads from "apis/leads";
import { Formik, Form } from "formik";
import { unmapLeadDetails } from "../../../../mapper/lead.mapper";

const getInitialvalues = (lead) => ({
  assignee_id: lead.assignee_id,
  reporter_id: lead.reporter_id,
  quality_code: lead.quality_code,
  state_code: lead.state_code,
  status_code: lead.status_code,
  priority_code: lead.priority_code
});

const CandidateSettings = ({ candidateDetails, setCandidateDetails, setShowCandidateSetting }) => {
  const [statusCodeList, setStatusCodeList] = useState<any>(null);
  const [allowUserList, setAllowUserLIst] = useState<any>(null);
  // const navigate = useNavigate();

  useEffect(() => {
    const getAllowedUsers = async () => {
      leadAllowedUsersApi.get()
        .then((data) => {
          setAllowUserLIst(data.data.allowed_user_list);
        }).catch(() => {
          setAllowUserLIst({});
        });
      leadItemsApi.get()
        .then((data) => {
          setStatusCodeList(data.data.status_codes);
        }).catch(() => {
          setStatusCodeList({});
        });
    };

    getAllowedUsers();
    setCandidateDetails(candidateDetails);
  }, []);

  const handleSubmit = async values => {
    await leads.update(candidateDetails.id, {
      lead: {
        "assignee_id": values.assignee_id,
        "reporter_id": values.reporter_id,
        "quality_code": values.quality_code,
        "state_code": values.state_code,
        "status_code": values.status_code,
        "priority_code": values.priority_code
      }
    }).then((res) => {
      setShowCandidateSetting(false);
      setCandidateDetails(unmapLeadDetails(res).leadDetails);
    })
  };

  const changeAssignee = async (val) => {
    await leads.update(candidateDetails.id, {
      lead: {
        "assignee_id": val
      }
    }).then((res) => {
      setShowCandidateSetting(false);
      setCandidateDetails(unmapLeadDetails(res).leadDetails);
    })
  };

  const changeReporter = async (val) => {
    await leads.update(candidateDetails.id, {
      lead: {
        "reporter_id": val
      }
    }).then((res) => {
      setShowCandidateSetting(false);
      setCandidateDetails(unmapLeadDetails(res).leadDetails);
    })
  };

  const changeStatusCode = async (val) => {
    await leads.update(candidateDetails.id, {
      lead: {
        "status_code": val
      }
    }).then((res) => {
      setShowCandidateSetting(false);
      setCandidateDetails(unmapLeadDetails(res).leadDetails);
    })
  };

  return (
    <>
      <span className='fixed top-0 left-0 w-full h-full bg-gray-800 bg-opacity-50' />
      <div aria-hidden="true" className="fixed top-0 left-0 right-0 z-50 w-full overflow-x-hidden overflow-y-auto md:inset-0 h-modal md:h-full">
        <div className="relative float-right w-full h-full max-w-md md:h-auto">
          <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
            <div className="flex items-center justify-between w-full px-8 py-6" style={{ backgroundColor: "#335CD6" }}>
              <strong className="text-xl font-medium text-white dark:text-white">Candidate Settings</strong>
              <button type="button" className="inline-flex items-center text-sm text-gray-400 bg-transparent rounded-lg hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white p-1.5"
                onClick={() => {setShowCandidateSetting(false)}}>
                <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                <span className="sr-only">Close modal</span>
              </button>
            </div>
            <div className="px-6 py-6 lg:px-8">
              <div className="space-y-6">

                <Formik
                  initialValues={getInitialvalues(candidateDetails)}
                  enableReinitialize={true}
                  onSubmit={handleSubmit}
                >
                  {({ errors, touched }) => (
                    <Form>
                      <div className="mb-6">
                        <label className="block mb-2 text-sm text-gray-600">Assignee</label>
                        <select
                          defaultValue={candidateDetails.assignee_id}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-miru-gray-100 focus:outline-none focus:ring focus:ring-indigo-100 focus:border-indigo-300"
                          name="assignee_id" onChange={(e) => changeAssignee(e.target.value)}>
                          <option value=''>Select Assignee</option>
                          {allowUserList &&
                            allowUserList.map((e: any) => <option value={e.id} key={e.id} selected={e.id === candidateDetails.assignee_id}>{e.first_name}{' '}{e.last_name}</option>)}
                        </select>
                        <div className="block text-xs tracking-wider text-red-600">
                          {errors.assignee_id && touched.assignee_id &&
                            <div>{`${errors.assignee_id}`}</div>
                          }
                        </div>
                      </div>

                      <div className="mb-6">
                        <label className="block mb-2 text-sm text-gray-600">Reporter</label>
                        <select
                          defaultValue={candidateDetails.reporter_id}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-miru-gray-100 focus:outline-none focus:ring focus:ring-indigo-100 focus:border-indigo-300"
                          name="reporter_id" onChange={(e) => changeReporter(e.target.value)}>
                          <option value=''>Select Reporter</option>
                          {allowUserList &&
                            allowUserList.map((e: any) => <option value={e.id} key={e.id} selected={e.id === candidateDetails.reporter_id}>{e.first_name}{' '}{e.last_name}</option>)}
                        </select>
                        <div className="block text-xs tracking-wider text-red-600">
                          {errors.reporter_id && touched.reporter_id &&
                            <div>{`${errors.reporter_id}`}</div>
                          }
                        </div>
                      </div>

                      <div className="mb-6">
                        <label className="block mb-2 text-sm text-gray-600">Status</label>
                        <select
                          defaultValue={candidateDetails.status_code}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-miru-gray-100 focus:outline-none focus:ring focus:ring-indigo-100 focus:border-indigo-300"
                          name="status_code" onChange={(e) => changeStatusCode(e.target.value)}>
                          <option value=''>Select Status</option>
                          {statusCodeList &&
                            statusCodeList.map((e: any) => <option value={e.id} key={e.id} selected={e.id === candidateDetails.status_code}>{e.name}</option>)}
                        </select>
                        <div className="flex items-center justify-between pt-1 text-red-700">
                          {errors.status_code && touched.status_code &&
                            <p className="text-xs">{`${errors.status_code}`}</p>
                          }
                        </div>
                      </div>

                    </Form>
                  )}
                </Formik>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CandidateSettings;
