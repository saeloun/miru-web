import React, { useState } from "react";

import { Formik, Form, Field } from "formik";
import * as Yup from "yup";

import leadQuotes from "apis/lead-quotes";
import Dialog from "common/Modal/Dialog";

const newItemSchema = Yup.object().shape({
  name: Yup.string().required("Name cannot be blank"),
});

const getInitialvalues = (item) => ({
  name: item.name,
  description: item.description,
  price: item.price
});

export interface IProps {
  setShowEditDialog: any;
  leadDetails: any;
  item: any;
}

const EditQuote = ({ leadDetails, item, setShowEditDialog }: IProps) => {

  const [apiError, setApiError] = useState<string>("");

  const handleSubmit = async values => {
    await leadQuotes.update(leadDetails.id, item.id, {
      "name": values.name,
      "description": values.description,
    }).then(() => {
      setShowEditDialog(false);
      document.location.reload();
    }).catch((e) => {
      setApiError(e.message);
    });
  };

  return (
    <Dialog title="Edit Line Item" open={true} onClose={() => { setShowEditDialog(false); }}>
      <Formik
        initialValues={getInitialvalues(item)}
        validationSchema={newItemSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched }) => (
          <Form>
            <div className="mt-4">
              <div className="field">
                <div className="field_with_errors">
                  <label className="form__label">Name</label>
                  <div className="tracking-wider block text-xs text-red-600">
                    {errors.name && touched.name &&
                    <div>{`${errors.name}`}</div>
                    }
                  </div>
                </div>
                <div className="mt-1">
                  <Field className={`form__input ${errors.name && touched.name && "border-red-600 focus:ring-red-600 focus:border-red-600"} `} name="name" />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="field">
                <div className="field_with_errors">
                  <label className="form__label">Description</label>
                  <div className="tracking-wider block text-xs text-red-600">
                    {errors.description && touched.description &&
                      <div>{`${errors.description}`}</div>
                    }
                  </div>
                </div>
                <div className="mt-1">
                  <Field className={`form__input ${errors.description && touched.description && "border-red-600 focus:ring-red-600 focus:border-red-600"} `} name="description" />
                </div>
              </div>
            </div>
            <p className="tracking-wider mt-3 block text-xs text-red-600">{apiError}</p>
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

export default EditQuote;
