import React, { useState } from "react";
import DateTimePicker from 'react-datetime-picker';
import { useNavigate } from "react-router-dom";
import leadTimelines from "apis/lead-timelines";
import Toastr from "common/Toastr";
import { Formik, Form, Field } from "formik";
import { X } from "phosphor-react";
import * as Yup from "yup";
import "yup-phone";

const newPhoneCallTimelineSchema = Yup.object().shape({
  action_phone_number: Yup.string().phone("IN", true, "Phone number is not valid").required()
});

const initialValues = {
  action_due_at: "",
  kind: "",
  action_description: "",
  action_subject: "",
  action_phone_number: ""
};

const NewPhoneCallTimeline = ({ leadDetails, setNewPhoneCallTimeline, timelineData, setTimelineData }) => {
  const navigate = useNavigate();
  const [actionDueAt, setActionDueAt] = useState(new Date());

  const handleSubmit = (values) => {
    leadTimelines.create(leadDetails.id, {
      "action_due_at": actionDueAt,
      "action_description": values.action_description,
      "kind": 4,
      "action_subject": values.action_subject,
      "action_phone_number": values.action_phone_number
    })
      .then(res => {
        setTimelineData([{ ...res.data }, ...timelineData]);
        navigate(`/leads/${leadDetails.id}/timelines`)
        setNewPhoneCallTimeline(false);
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
    <div className="px-4 flex items-center justify-center">
      <div
        className="overflow-auto fixed top-0 left-0 right-0 bottom-0 inset-0 z-10 flex items-start justify-center"
        style={{
          backgroundColor: "rgba(29, 26, 49, 0.6)"
        }}
      >
        <div className="relative px-4 h-full w-full md:flex md:items-center md:justify-center">
          <div className="rounded-lg px-6 pb-6 bg-white shadow-xl transform transition-all sm:align-middle sm:max-w-md modal-width">
            <div className="flex justify-between items-center mt-6">
              <h6 className="text-base font-extrabold">Add New Timeline</h6>
              <button type="button" onClick={() => { setNewPhoneCallTimeline(false); }}>
                <X size={16} color="#CDD6DF" weight="bold" />
              </button>
            </div>
            <Formik
              initialValues={initialValues}
              validationSchema={newPhoneCallTimelineSchema}
              onSubmit={handleSubmit}
            >
              {({ errors, touched }) => (
                <Form>
                  <div className="mt-4">
                    <div className="field">
                      <div className="field_with_errors">
                        <label className="form__label">Subject</label>
                        <div className="tracking-wider block text-xs text-red-600">
                          {errors.action_subject && touched.action_subject &&
                            <div>{errors.action_subject}</div>
                          }
                        </div>
                      </div>
                      <div className="mt-1">
                        <Field className={`form__input bg-gray-200 ${errors.action_subject && touched.action_subject && "border-red-600 focus:ring-red-600 focus:border-red-600"} `} name="action_subject" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="field">
                      <div className="field_with_errors">
                        <label className="form__label">Phone Number</label>
                        <div className="tracking-wider block text-xs text-red-600">
                          {errors.action_phone_number && touched.action_phone_number &&
                            <div>{errors.action_phone_number}</div>
                          }
                        </div>
                      </div>
                      <div className="mt-1">
                        <Field className={`form__input bg-gray-200 ${errors.action_phone_number && touched.action_phone_number && "border-red-600 focus:ring-red-600 focus:border-red-600"} `} name="action_phone_number" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="field">
                      <div className="field_with_errors">
                        <label className="form__label">Due at</label>
                        <div className="tracking-wider block text-xs text-red-600">
                          {errors.action_due_at && touched.action_due_at &&
                            <div>{errors.action_due_at}</div>
                          }
                        </div>
                      </div>
                      <div className="mt-1">
                        <DateTimePicker
                          onChange={(val) => changeDueAt(val)}
                          value={actionDueAt}
                          format={"dd-MM-yyyy hh:mm:ss a"}
                          className={`w-full border rounded bg-gray-200 ${errors.action_due_at && touched.action_due_at && "border-red-600 focus:ring-red-600 focus:border-red-600"}`}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="field">
                      <div className="field_with_errors">
                        <label className="form__label">Description</label>
                        <div className="tracking-wider block text-xs text-red-600">
                          {errors.action_description && touched.action_description &&
                            <div>{errors.action_description}</div>
                          }
                        </div>
                      </div>
                      <div className="mt-1">
                        <Field className={`w-full border rounded bg-gray-200 ${errors.action_description && touched.action_description && "border-red-600 focus:ring-red-600 focus:border-red-600"}`}
                          name="action_description" as="textarea" rows={8} />
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewPhoneCallTimeline;
