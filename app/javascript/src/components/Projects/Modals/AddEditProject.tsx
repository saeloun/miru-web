import React, { useEffect, useState } from "react";

import Select from "react-select";
import { X } from "phosphor-react";

const AddEditProject = ({ editProjectId, setShowProjectModal }) => {

  const [client, setClient] = useState<any>();
  const [projectName, setProjectName] = useState<any>();
  const [projectType, setProjectType] = useState<any>("Billable");

  // useEffect(() => {
  //   allprojects.map(project => {
  //     if (project.id == editProjectId) {
  //       setClient(project.client.name);
  //       setProjectName(project.name);
  //       setProjectType(project.isBillable ? "Billable" : "Non-Billable");
  //     }
  //   });
  // }, [editProjectId]);

  return (
    <div className="modal__modal main-modal" style={{ background: "rgba(29, 26, 49,0.6)" }}>
      <div className="modal__container modal-container">
        <div className="modal__content modal-content">
          <div className="modal__position">
            <h6 className="modal__title">{editProjectId ? "Edit Project Details" : "Add New Project"}</h6>
            <div className="modal__close">
              <button
                className="modal__button"
                onClick={() => setShowProjectModal(false)}
              >
                <X size={15} color="#CDD6DF" />
              </button>
            </div>
          </div>
          <div className="modal__form flex-col">
            <div className="mt-4">
              <div className="field">
                <div className="field_with_errors">
                  <label className="tracking-wider block text-xs font-normal text-miru-dark-purple-1000">
                    Client
                  </label>
                </div>
                <div className="mt-1">
                  <Select
                    defaultValue={client}
                    onChange={e => { setClient(e); }}
                    options={[{ value: "Client1", label: "client1" }, { value: "Client2", label: "client2" }]}
                    placeholder="Select Client"
                    isSearchable={true}
                    components={{
                      IndicatorSeparator: () => null
                    }}
                    styles={{
                      option: (styles, { isSelected }) => ({
                        ...styles,
                        backgroundColor: isSelected ? "#F5F7F9" : null,
                        color: isSelected ? "miru-dark-purple-1000" : null,
                        height: "40px",
                        "&:hover": {
                          backgroundColor: "#F5F7F9"
                        }
                      }),
                      control: (base, state) => ({
                        ...base,
                        backgroundColor: "#F5F7F9",
                        borderColor: "#F5F7F9",
                        boxShadow: state.isFocused ? "0px" : "0px",
                        border: state.isFocused ? "0px" : "0px",
                        "&:hover": {
                          border: state.isFocused ? "0px" : "0px"
                        }
                      }),
                      placeholder: defaultStyles => ({
                        ...defaultStyles,
                        color: "#A5A3AD",
                        fontWeight: "500",
                        fontSize: "16px"
                      }),
                      menu: base => ({
                        ...base,
                        marginTop: 0,
                        border: 0,
                        borderRadius: "4px"
                      })
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="field">
                <div className="field_with_errors">
                  <label className="tracking-wider block text-xs font-normal text-miru-dark-purple-1000">
                    Project Name
                  </label>
                </div>
                <div className="mt-1">
                  <input type="text" placeholder=" Enter Project Name" className="rounded appearance-none border-0 block w-full px-3 py-2 bg-miru-gray-100 h-8 font-medium text-sm text-miru-dark-purple-1000 focus:outline-none sm:text-base" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="field">
                <label className="tracking-wider block text-xs font-normal text-miru-dark-purple-1000">Project Type</label>
                <div className="mt-1">
                  <div className="space-y-4 sm:flex sm:items-center sm:space-y-0 sm:space-x-10">
                    <div className="flex items-center">
                      <input type="radio" id='billable' name='project_type' defaultChecked={projectType === "Billable"} className="focus:ring-miru-han-purple-1000 h-4 w-4 border-miru-han-purple-1000 text-miru-dark-purple-1000 cursor-pointer" onClick={() => setProjectType("Billable")} />
                      <label htmlFor="billable" className="ml-3 block text-sm font-medium text-miru-dark-purple-1000">
                        Billable
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input type="radio" id='non-billable' name='project_type' defaultChecked={projectType === "Non-Billable"} className="focus:ring-miru-han-purple-1000 h-4 w-4 bg--miru-han-purple-1000 border-miru-han-purple-1000 text-miru-dark-purple-1000 cursor-pointer" onClick={() => setProjectType("Non-Billable")} />
                      <label htmlFor="non-billable" className="ml-3 block text-sm font-medium text-miru-dark-purple-1000 ">
                        Non-billable
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="actions mt-4">
              {client && projectName && projectType ?
                <button type="submit" className="tracking-widest h-10 w-full flex justify-center py-1 px-4 border border-transparent shadow-sm text-base font-sans font-medium text-miru-white-1000 bg-miru-han-purple-1000 hover:bg-miru-han-purple-600 focus:outline-none rounded cursor-pointer">{editProjectId ? " SAVE CHANGES" : "ADD PROJECT"}</button>
                : <button type="submit" className="tracking-widest h-10 w-full flex justify-center py-1 px-4 border border-transparent shadow-sm text-base font-sans font-medium text-miru-white-1000 bg-miru-gray-1000 focus:outline-none rounded cursor-pointer">{editProjectId ? "SAVE CHANGES" : "ADD PROJECT"}</button>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEditProject;
