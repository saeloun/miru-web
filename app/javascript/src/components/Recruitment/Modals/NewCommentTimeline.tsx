import React from "react";

import { Formik, Form, Field } from "formik";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";

import leadTimelines from "apis/lead-timelines";
import Dialog from "common/Modal/Dialog";
import Toastr from "common/Toastr";

const newCommentTimelineSchema = Yup.object().shape({
  comment: Yup.string().required("Comment cannot be blank")
});

const initialValues = {
  comment: "",
  kind: ""
};

const NewCommentTimeline = ({ candidateDetails, setNewCommentTimeline, timelineData, setTimelineData }) => {
  const navigate = useNavigate();

  const handleSubmit = (values) => {
    leadTimelines.create(candidateDetails.id, {
      "comment": values.comment,
      "kind": 1,
      "action_subject": "added_form"
    })
      .then(res => {
        setTimelineData([{ ...res.data }, ...timelineData]);
        navigate(`/leads/${candidateDetails.id}/timelines`)
        setNewCommentTimeline(false);
        Toastr.success("Timeline added successfully");
      });
  };

  return (
    <Dialog title="Add New Comment" open={true} onClose={() => { setNewCommentTimeline(false); }}>
      <Formik
        initialValues={initialValues}
        validationSchema={newCommentTimelineSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched }) => (
          <Form>
            <div className="mt-4">
              <div className="field">
                <div className="field_with_errors">
                  <label className="form__label">Comment</label>
                  <div className="block text-xs tracking-wider text-red-600">
                    {errors.comment && touched.comment &&
                      <div>{`${errors.comment}`}</div>
                    }
                  </div>
                </div>
                <div className="mt-1">
                  <Field className={`w-full border border-gray-300 dark:border-gray-700 p-2 shadow-sm rounded text-sm focus:outline-none focus:border-blue-700 bg-transparent placeholder-gray-500 text-gray-600 dark:text-gray-400 ${errors.comment && touched.comment && "border-red-600 focus:ring-red-600 focus:border-red-600"}`}
                    name="comment" as="textarea" rows={8} />
                </div>
              </div>
            </div>
            <div className="mt-4 actions">
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

export default NewCommentTimeline;
