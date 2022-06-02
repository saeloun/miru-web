import React, { useEffect, useState } from "react";

import leadItemsApi from "apis/lead-items";
import leadLineItems from "apis/lead-line-items";
import { Formik, Form, Field } from "formik";
import { X } from "phosphor-react";
import * as Yup from "yup";

const newItemSchema = Yup.object().shape({
  name: Yup.string().required("Name cannot be blank"),
  price: Yup.number().typeError("Invalid Price"),
  number_of_resource: Yup.number().typeError("Invalid Number of Resource"),
  resource_expertise_level: Yup.number().typeError("Invalid Resource Expertise Level")
});

const getInitialvalues = (item) => ({
  name: item.name,
  description: item.description,
  price: item.price,
  kind: item.kind,
  number_of_resource: item.number_of_resource,
  resource_expertise_level: item.resource_expertise_level
});

export interface IProps {
  setShowEditDialog: any;
  leadDetails: any;
  item: any;
}

const EditLineItem = ({ leadDetails, item, setShowEditDialog }: IProps) => {

  const [apiError, setApiError] = useState<string>("");

  const [kindList, setKindList] = useState<any>(null);
  const [kindVal, setKindVal] = useState<any>(null);

  useEffect(() => {
    const getLeadItems = async () => {
      leadItemsApi.get()
        .then((data) => {
          setKindList(data.data.line_item_kind_names);
        }).catch(() => {
          setKindList({});
        });
    };

    getLeadItems();
  }, []);

  const handleSubmit = async values => {
    await leadLineItems.update(leadDetails.id, item.id, {
      "name": values.name,
      "description": values.description,
      "price": values.price,
      "kind": kindVal || values.kind,
      "number_of_resource": values.number_of_resource,
      "resource_expertise_level": values.resource_expertise_level
    }).then(() => {
      setShowEditDialog(false);
      document.location.reload();
    }).catch((e) => {
      setApiError(e.message);
    });
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
              <h6 className="text-base font-extrabold">Edit Line Item</h6>
              <button type="button" onClick={() => { setShowEditDialog(false); }}>
                <X size={16} color="#CDD6DF" weight="bold" />
              </button>
            </div>
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
                          <div>{errors.name}</div>
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
                        <label className="tracking-wider block text-xs font-normal text-miru-dark-purple-1000">
                          Kind
                        </label>
                      </div>
                      <div className="mt-1">
                        <select
                          defaultValue={item.kind}
                          className="rounded border-0 block w-full px-2 py-1 bg-miru-gray-100 h-8 font-medium text-sm text-miru-dark-purple-1000 focus:outline-none sm:text-base"
                          name="kind" onChange={(e) => setKindVal(e.target.value)}>
                          <option value=''>Select Kind</option>
                          {kindList &&
                            kindList.map(e => <option value={e.id} key={e.id} selected={e.id === item.kind} >{e.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="field">
                      <div className="field_with_errors">
                        <label className="tracking-wider block text-xs font-normal text-miru-dark-purple-1000">
                          Number of Resource
                        </label>
                        <div className="tracking-wider block text-xs text-red-600">
                          {errors.number_of_resource && touched.number_of_resource &&
                            <div>{errors.number_of_resource}</div>
                          }
                        </div>
                      </div>
                      <div className="mt-1">
                        <Field className={`form__input rounded tracking-wider border block w-full px-3 py-2 bg-miru-gray-100 shadow-sm text-xs text-miru-dark-purple-1000 focus:outline-none ${errors.number_of_resource && touched.number_of_resource && "border-red-600 focus:ring-red-600 focus:border-red-600"} `} name="number_of_resource" type="number" min="0" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="field">
                      <div className="field_with_errors">
                        <label className="tracking-wider block text-xs font-normal text-miru-dark-purple-1000">
                          Resource Expertise Level
                        </label>
                        <div className="tracking-wider block text-xs text-red-600">
                          {errors.resource_expertise_level && touched.resource_expertise_level &&
                            <div>{errors.resource_expertise_level}</div>
                          }
                        </div>
                      </div>
                      <div className="mt-1">
                        <Field className={`form__input rounded tracking-wider border block w-full px-3 py-2 bg-miru-gray-100 shadow-sm text-xs text-miru-dark-purple-1000 focus:outline-none ${errors.resource_expertise_level && touched.resource_expertise_level && "border-red-600 focus:ring-red-600 focus:border-red-600"} `} name="resource_expertise_level" type="number" min="0" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="field">
                      <div className="field_with_errors">
                        <label className="form__label">Description</label>
                        <div className="tracking-wider block text-xs text-red-600">
                          {errors.description && touched.description &&
                            <div>{errors.description}</div>
                          }
                        </div>
                      </div>
                      <div className="mt-1">
                        <Field className={`form__input ${errors.description && touched.description && "border-red-600 focus:ring-red-600 focus:border-red-600"} `} name="description" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="field">
                      <div className="field_with_errors">
                        <label className="tracking-wider block text-xs font-normal text-miru-dark-purple-1000">
                          Price
                        </label>
                        <div className="tracking-wider block text-xs text-red-600">
                          {errors.price && touched.price &&
                            <div>{errors.price}</div>
                          }
                        </div>
                      </div>
                      <div className="mt-1">
                        <Field className={`form__input rounded tracking-wider border block w-full px-3 py-2 bg-miru-gray-100 shadow-sm text-xs text-miru-dark-purple-1000 focus:outline-none ${errors.price && touched.price && "border-red-600 focus:ring-red-600 focus:border-red-600"} `} name="price" type="number" min="0" />
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditLineItem;
