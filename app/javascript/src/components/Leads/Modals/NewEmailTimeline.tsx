import React, { useEffect, useState } from "react";

import { Formik, Form, Field } from "formik";
import DateTimePicker from 'react-datetime-picker';
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";

import leadAllowedUsersApi from "apis/lead-allowed-users";
import leadTimelineItemsApi from "apis/lead-timeline-items";
import leadTimelines from "apis/lead-timelines";
import Dialog from "common/Modal/Dialog";
import Toastr from "common/Toastr";

const newEmailTimelineSchema = Yup.object().shape({
  action_email: Yup.string().required("Email cannot be blank").email("Invalid email ID")
});

const initialValues = {
  action_due_at: "",
  kind: "",
  action_description: "",
  action_subject: "",
  action_email: "",
  action_priority_code: "",
  action_assignee_id: "",
  action_reporter_id: ""
};

const NewEmailTimeline = ({ leadDetails, setNewEmailTimeline, timelineData, setTimelineData }) => {
  const navigate = useNavigate();
  const [actionDueAt, setActionDueAt] = useState(new Date());

  const [priorityCodeList, setPriorityCodeList] = useState<any>(null);
  const [priorityCode, setPriorityCode] = useState<any>(null);

  const [assigneeId, setAssigneeId] = useState<any>(null);
  const [reporterId, setReporterId] = useState<any>(null);
  const [allowUserList, setAllowUserLIst] = useState<any>(null);

  useEffect(() => {
    const getLeadTimelineItems = async () => {
      leadTimelineItemsApi.get()
        .then((data) => {
          setPriorityCodeList(data.data.priority_codes);
        }).catch(() => {
          setPriorityCodeList({});
        });
    };

    const getAllowedUsers = async () => {
      leadAllowedUsersApi.get()
        .then((data) => {
          setAllowUserLIst(data.data.allowed_user_list);
        }).catch(() => {
          setAllowUserLIst({});
        });
    };

    getLeadTimelineItems();
    getAllowedUsers();
  }, [leadDetails]);

  const handleSubmit = (values) => {
    leadTimelines.create(leadDetails.id, {
      "action_due_at": actionDueAt,
      "action_description": values.action_description,
      "kind": 3,
      "action_subject": values.action_subject,
      "action_email": values.action_email,
      "action_priority_code": priorityCode || 0,
      "action_assignee_id": assigneeId,
      "action_reporter_id": reporterId
    })
      .then(res => {
        setTimelineData([{ ...res.data }, ...timelineData]);
        navigate(`/leads/${leadDetails.id}/timelines`)
        setNewEmailTimeline(false);
        Toastr.success("Timeline added successfully");
      });
  };

  const changeDueAt = (val) => {
    const todayDate = new Date();

    if (val){
      const valDate = new Date(val);

      if (valDate.getTime() > todayDate.getTime()){
        setActionDueAt(val);
      } else {
        alert("Date cannot be in the past");
        setActionDueAt(todayDate);
      }
    } else {
      alert("Date is required");
      setActionDueAt(todayDate);
    }
  };

  return (
    <Dialog title="Add New Action : Email" open={true} onClose={() => { setNewEmailTimeline(false); }}>
      <Formik
        initialValues={initialValues}
        validationSchema={newEmailTimelineSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched }) => (
          <Form>
            <div className="mt-2.5">
              <div className="field">
                <div className="field_with_errors">
                  <label className="form__label">Subject</label>
                  <div className="tracking-wider block text-xs text-red-600">
                    {errors.action_subject && touched.action_subject &&
                      <div>{`${errors.action_subject}`}</div>
                    }
                  </div>
                </div>
                <div className="mt-1">
                  <Field className={`w-full border border-gray-300 dark:border-gray-700 p-1 shadow-sm rounded text-sm focus:outline-none focus:border-blue-700 bg-transparent placeholder-gray-500 text-gray-600 dark:text-gray-400 ${errors.action_subject && touched.action_subject && "border-red-600 focus:ring-red-600 focus:border-red-600"} `} name="action_subject" />
                </div>
              </div>
            </div>
            <div className="mt-2.5">
              <div className="field">
                <div className="field_with_errors">
                  <label className="form__label">Email</label>
                  <div className="tracking-wider block text-xs text-red-600">
                    {errors.action_email && touched.action_email &&
                      <div>{`${errors.action_email}`}</div>
                    }
                  </div>
                </div>
                <div className="mt-1">
                  <Field className={`w-full border border-gray-300 dark:border-gray-700 p-1 shadow-sm rounded text-sm focus:outline-none focus:border-blue-700 bg-transparent placeholder-gray-500 text-gray-600 dark:text-gray-400 ${errors.action_email && touched.action_email && "border-red-600 focus:ring-red-600 focus:border-red-600"} `} name="action_email" />
                </div>
              </div>
            </div>
            <div className="mt-2.5">
              <div className="field">
                <div className="field_with_errors">
                  <label className="form__label">Due at</label>
                  <div className="tracking-wider block text-xs text-red-600">
                    {errors.action_due_at && touched.action_due_at &&
                      <div>{`${errors.action_due_at}`}</div>
                    }
                  </div>
                </div>
                <div className="mt-1">
                  <DateTimePicker
                    onChange={(val) => changeDueAt(val)}
                    value={actionDueAt}
                    format={"dd-MM-yyyy hh:mm:ss a"}
                    className={`w-full border border-gray-300 dark:border-gray-700 p-1 shadow-sm rounded text-sm focus:outline-none focus:border-blue-700 bg-transparent placeholder-gray-500 text-gray-600 dark:text-gray-400 ${errors.action_due_at && touched.action_due_at && "border-red-600 focus:ring-red-600 focus:border-red-600"}`}
                  />
                </div>
              </div>
            </div>
            <div className="mt-2.5">
              <div className="field">
                <div className="field_with_errors">
                  <label className="form__label">Assignee</label>
                  <div className="tracking-wider block text-xs text-red-600">
                    {errors.action_assignee_id && touched.action_assignee_id &&
                      <div>{`${errors.action_assignee_id}`}</div>
                    }
                  </div>
                </div>
                <div className="mt-1">
                  <select
                    className="w-full border border-gray-300 dark:border-gray-700 p-1 shadow-sm rounded text-sm focus:outline-none focus:border-blue-700 bg-transparent placeholder-gray-500 text-gray-600 dark:text-gray-400"
                    name="action_assignee_id" onChange={(e) => setAssigneeId(e.target.value)}>
                    <option value=''>Select Assignee</option>
                    {allowUserList &&
                      allowUserList.map(e => <option value={e.id} key={e.id} >{e.first_name}{' '}{e.last_name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-2.5">
              <div className="field">
                <div className="field_with_errors">
                  <label className="form__label">Reporter</label>
                  <div className="tracking-wider block text-xs text-red-600">
                    {errors.action_reporter_id && touched.action_reporter_id &&
                      <div>{`${errors.action_reporter_id}`}</div>
                    }
                  </div>
                </div>
                <div className="mt-1">
                  <select
                    className="w-full border border-gray-300 dark:border-gray-700 p-1 shadow-sm rounded text-sm focus:outline-none focus:border-blue-700 bg-transparent placeholder-gray-500 text-gray-600 dark:text-gray-400"
                    name="action_reporter_id" onChange={(e) => setReporterId(e.target.value)}>
                    <option value=''>Select Reporter</option>
                    {allowUserList &&
                      allowUserList.map(e => <option value={e.id} key={e.id} >{e.first_name}{' '}{e.last_name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-2.5">
              <div className="field">
                <div className="field_with_errors">
                  <label className="form__label">Description</label>
                  <div className="tracking-wider block text-xs text-red-600">
                    {errors.action_description && touched.action_description &&
                      <div>{`${errors.action_description}`}</div>
                    }
                  </div>
                </div>
                <div className="mt-1">
                  <Field className={`w-full border border-gray-300 dark:border-gray-700 p-2 shadow-sm rounded text-sm focus:outline-none focus:border-blue-700 bg-transparent placeholder-gray-500 text-gray-600 dark:text-gray-400 ${errors.action_description && touched.action_description && "border-red-600 focus:ring-red-600 focus:border-red-600"}`}
                    name="action_description" as="textarea" rows={4} />
                </div>
              </div>
            </div>
            <div className="mt-2.5">
              <div className="field">
                <div className="field_with_errors">
                  <label className="form__label">Priority</label>
                  <div className="tracking-wider block text-xs text-red-600">
                    {errors.action_priority_code && touched.action_priority_code &&
                      <div>{`${errors.action_priority_code}`}</div>
                    }
                  </div>
                </div>
                <div className="mt-1">
                  <select
                    className="w-full border border-gray-300 dark:border-gray-700 p-1 shadow-sm rounded text-sm focus:outline-none focus:border-blue-700 bg-transparent placeholder-gray-500 text-gray-600 dark:text-gray-400"
                    name="action_priority_code" onChange={(e) => setPriorityCode(e.target.value)} >
                    <option value=''>Select Priority</option>
                    {priorityCodeList &&
                      priorityCodeList.map(e => <option value={e.id} key={e.id} >{e.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="actions mt-4">
              <input
                type="submit"
                name="commit"
                value="SAVE CHANGES"
                className="form__input_submit"
              />
            </div>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default NewEmailTimeline;
