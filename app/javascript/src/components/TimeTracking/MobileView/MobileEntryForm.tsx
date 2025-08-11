import React, { useState, useRef, useEffect } from "react";

import CustomCheckbox from "common/CustomCheckbox";
import CustomDatePicker from "common/CustomDatePicker";
import { CustomInputText } from "common/CustomInputText";
import { CustomTextareaAutosize } from "common/CustomTextareaAutosize";
import dayjs from "dayjs";
import { minFromHHMM, minToHHMM, useDebounce } from "helpers";
import {
  SearchIcon,
  XIcon,
  CalendarIcon,
  PlusIcon,
  MinusIcon,
  CopyIcon,
  DeleteIcon,
  CaretDownIcon,
} from "miruIcons";
import {
  Button,
  MobileMoreOptions,
  SidePanel,
  TimeInput,
} from "StyledComponents";

import DeleteEntryModal from "./DeleteEntryModal";

const AddEntryMobile = ({
  project,
  setProject,
  projects,
  client,
  setClient,
  clients,
  note,
  setNote,
  billable,
  setBillable,
  selectedDate,
  setSelectedDate,
  duration,
  setDuration,
  setNewEntryView,
  handleSave,
  handleEdit,
  editEntryId,
  setEditEntryId,
  handleDeleteEntry,
  submitting,
  setSubmitting,
}) => {
  const [showClientList, setShowClientList] = useState<boolean>(false);
  const [clientList, setClientList] = useState<any>(clients);
  const [projectList, setProjectList] = useState<any>(projects[client]);
  const [showProjectList, setShowProjectList] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [projectSearchQuery, setProjectSearchQuery] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [isProjectBillable, setIsProjectBillable] = useState<boolean>(false);
  const datePickerRef = useRef(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const debouncedProjectSearchQuery = useDebounce(projectSearchQuery, 500);
  const disableApplyBtn = client && project && note && selectedDate && duration;

  useEffect(() => {
    if (debouncedSearchQuery && clientList.length > 0) {
      const newList = clientList.filter(client =>
        client.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );

      newList.length > 0 ? setClientList(newList) : setClientList([]);
    } else {
      setClientList(clients);
    }
  }, [debouncedSearchQuery]);

  useEffect(() => {
    if (debouncedProjectSearchQuery && projectList.length > 0) {
      const newList = projectList.filter(project =>
        project.name
          .toLowerCase()
          .includes(debouncedProjectSearchQuery.toLowerCase())
      );

      newList.length > 0 ? setProjectList(newList) : setProjectList([]);
    } else {
      setProjectList(projects[client]);
    }
  }, [debouncedProjectSearchQuery]);

  useEffect(() => {
    setProjectList(projects[client]);
  }, [client]);

  useEffect(() => {
    if (projects[client]) {
      const selectedProject = projects[client].find(
        currentProject => currentProject.name === project
      );
      setIsProjectBillable(selectedProject?.billable);
    }
  }, [project, client]);

  const handleBillableCheck = () => {
    if (isProjectBillable) setBillable(!billable);
  };

  const handleDatePicker = date => {
    setShowDatePicker(false);
    setSelectedDate(dayjs(date).format("YYYY-MM-DD"));
  };

  const handleIncreaseTime = () => {
    const mint = minFromHHMM(duration);
    const formattedHHMM = minToHHMM(mint);
    const times = formattedHHMM.split(":");
    const hour = times[0];
    const min = times[1];
    const hhmm = ((parseInt(hour) * 60 + parseInt(min) + 15) / 60).toFixed(2);
    const addition = minToHHMM(minFromHHMM(hhmm));
    setDuration(addition);
  };

  const handleDecreaseTime = () => {
    if (parseInt(duration) > 0) {
      const mint = minFromHHMM(duration);
      const formattedHHMM = minToHHMM(mint);
      const times = formattedHHMM.split(":");
      const hour = times[0];
      const min = times[1];
      const hhmm = ((parseInt(hour) * 60 + parseInt(min) - 15) / 60).toFixed(2);
      const substraction = minToHHMM(minFromHHMM(hhmm));
      setDuration(substraction);
    }
  };

  const handleClose = () => {
    setNewEntryView(false);
    setEditEntryId(0);
  };

  const handleDuplicate = () => {
    handleSave();
    setNewEntryView(false);
    setEditEntryId(0);
  };

  const handleDurationChange = val => {
    setDuration(val);
  };

  return (
    <>
      <SidePanel
        disableOutsideClick
        WrapperClassname="z-50 justify-content-between lg:hidden bg-white"
        setFilterVisibilty={setNewEntryView}
      >
        <SidePanel.Header className="mb-2 flex items-center justify-between bg-miru-han-purple-1000 px-5 py-5 text-white lg:bg-white lg:font-bold lg:text-miru-dark-purple-1000">
          <span className="flex w-full items-center justify-center pl-6 text-base font-medium leading-5">
            {editEntryId ? "Edit Time Entry" : "New Time Entry"}
          </span>
          <Button style="ternary" onClick={handleClose}>
            <XIcon
              className="text-white lg:text-miru-dark-purple-1000"
              size={16}
            />
          </Button>
        </SidePanel.Header>
        <SidePanel.Body className="sidebar__filters flex h-full flex-col justify-between overflow-y-auto px-4">
          <div className="flex flex-auto flex-col justify-between">
            <div>
              <div className="py-3">
                <div
                  className="relative flex w-full flex-col"
                  onClick={() => {
                    setShowClientList(true);
                  }}
                >
                  <CustomInputText
                    autoFocus
                    disabled={showClientList}
                    id="Client"
                    label="Client"
                    name="Client"
                    type="text"
                    value={client && client}
                  />
                  <CaretDownIcon
                    className="absolute top-0 bottom-0 right-1 mx-2 my-3 "
                    color="#5B34EA"
                    size={20}
                    weight="bold"
                  />
                </div>
                {showClientList && (
                  <MobileMoreOptions
                    className="h-1/2"
                    setVisibilty={setShowClientList}
                    visibilty={showClientList}
                  >
                    {clientList.length > 0 && (
                      <div className="relative mt-2 flex w-full items-center">
                        <input
                          placeholder="Search"
                          type="text"
                          value={searchQuery}
                          className="focus:outline-none w-full rounded bg-miru-gray-100 p-2
            text-sm font-medium focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
                          onChange={e => {
                            setSearchQuery(e.target.value);
                          }}
                        />
                        {searchQuery ? (
                          <XIcon
                            className="absolute right-2"
                            color="#1D1A31"
                            size={16}
                            onClick={() => setSearchQuery("")}
                          />
                        ) : (
                          <SearchIcon
                            className="absolute right-2"
                            color="#1D1A31"
                            size={16}
                          />
                        )}
                      </div>
                    )}
                    {clientList.length > 0 ? (
                      clientList.map((eachClient, index) => (
                        <li
                          key={index}
                          className={`flex items-center px-2 pt-3 text-sm leading-5 text-miru-dark-purple-1000 hover:bg-miru-gray-100 ${
                            eachClient.name == client
                              ? "font-bold"
                              : "font-normal"
                          }`}
                          onClick={() => {
                            setClient(eachClient.name);
                            setProject("");
                            setShowClientList(false);
                            document.getElementById("Project").focus();
                          }}
                        >
                          {eachClient.name}
                        </li>
                      ))
                    ) : (
                      <div className="mt-5 text-center">
                        No Clients present.
                      </div>
                    )}
                  </MobileMoreOptions>
                )}
              </div>
              <div className="py-3">
                <div
                  className="relative flex w-full flex-col"
                  onClick={() => {
                    setShowProjectList(true);
                  }}
                >
                  <CustomInputText
                    disabled={showProjectList}
                    id="Project"
                    label="Project"
                    name="Project"
                    type="text"
                    value={project}
                  />
                  <CaretDownIcon
                    className="absolute top-0 bottom-0 right-1 mx-2 my-3 "
                    color="#5B34EA"
                    size={20}
                    weight="bold"
                  />
                </div>
                {showProjectList && (
                  <MobileMoreOptions
                    className="h-1/2"
                    setVisibilty={setShowProjectList}
                    visibilty={showProjectList}
                  >
                    {client && projectList.length > 0 && (
                      <div className="relative mt-2 flex w-full items-center">
                        <input
                          placeholder="Search"
                          type="text"
                          value={projectSearchQuery}
                          className="focus:outline-none w-full rounded bg-miru-gray-100 p-2
            text-sm font-medium focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
                          onChange={e => {
                            setProjectSearchQuery(e.target.value);
                          }}
                        />
                        {projectSearchQuery ? (
                          <XIcon
                            className="absolute right-2"
                            color="#1D1A31"
                            size={16}
                            onClick={() => setProjectSearchQuery("")}
                          />
                        ) : (
                          <SearchIcon
                            className="absolute right-2"
                            color="#1D1A31"
                            size={16}
                          />
                        )}
                      </div>
                    )}
                    {client && projectList.length > 0 ? (
                      projectList.map((eachProject, index) => (
                        <li
                          key={index}
                          className={`flex items-center px-2 pt-3 text-sm leading-5 text-miru-dark-purple-1000 hover:bg-miru-gray-100 ${
                            eachProject.name == project
                              ? "font-bold"
                              : "font-normal"
                          }`}
                          onClick={() => {
                            setProject(eachProject.name);
                            setShowProjectList(false);
                            document.getElementById("Description").click();
                          }}
                        >
                          {eachProject.name}
                        </li>
                      ))
                    ) : (
                      <div className="mt-5 text-center">
                        {client
                          ? "No project(s) present for selected client."
                          : "Please select client."}
                      </div>
                    )}
                  </MobileMoreOptions>
                )}
              </div>
              <div className="py-3">
                <CustomTextareaAutosize
                  id="Description"
                  label="Description"
                  maxRows={12}
                  name="Description"
                  rows={5}
                  value={note}
                  onChange={e => setNote(e.target["value"])}
                />
              </div>
              <div className="flex w-full flex-col py-3">
                <div
                  className="field relative flex w-full flex-col"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                >
                  <CustomInputText
                    disabled
                    id="date"
                    label="Date"
                    name="date"
                    type="text"
                    value={dayjs(selectedDate).format("MM.DD.YYYY")}
                    onChange={e => {
                      setSelectedDate(e.target.value);
                    }}
                  />
                  <CalendarIcon
                    className="absolute top-0 bottom-0 right-1 mx-2 my-3 "
                    color="#5B34EA"
                    size={20}
                    weight="bold"
                  />
                </div>
                {showDatePicker && (
                  <CustomDatePicker
                    date={new Date(selectedDate)}
                    handleChange={handleDatePicker}
                    setVisibility={setShowDatePicker}
                    wrapperRef={datePickerRef}
                  />
                )}
              </div>
              <div className="py-3">
                <CustomCheckbox
                  checkboxValue={1}
                  handleCheck={handleBillableCheck}
                  id={1}
                  isChecked={billable}
                  text="Billable"
                  wrapperClassName="flex items-center m-auto p-2"
                  labelClassName={`${
                    isProjectBillable
                      ? "text-miru-dark-purple-1000"
                      : "text-miru-gray-1000"
                  } text-sm font-medium`}
                />
              </div>
              <div className="flex items-center justify-between rounded border border-miru-gray-1000">
                <Button style="ternary" onClick={handleDecreaseTime}>
                  <MinusIcon
                    className="m-4 text-miru-dark-purple-1000"
                    size={20}
                    weight="bold"
                  />
                </Button>
                <TimeInput
                  className="focus:outline-none w-1/2 cursor-pointer rounded text-center text-xl font-bold text-miru-dark-purple-1000 placeholder:text-miru-dark-purple-200 focus:border-miru-gray-1000 focus:bg-white focus:ring-1 focus:ring-miru-gray-1000"
                  initTime={duration}
                  name="timeInput"
                  onTimeChange={handleDurationChange}
                />
                <Button style="ternary" onClick={handleIncreaseTime}>
                  <PlusIcon
                    className="m-4 text-miru-dark-purple-1000"
                    size={20}
                    weight="bold"
                  />
                </Button>
              </div>
            </div>
            {editEntryId ? (
              <div className="flex w-full items-center justify-between">
                <Button
                  className="mr-1 flex w-1/2 items-center justify-center py-2 px-10/100"
                  style="secondary"
                  onClick={handleDuplicate}
                >
                  <CopyIcon
                    className="mr-2 text-miru-han-purple-1000"
                    size={20}
                  />
                  <span className="font-bold">Duplicate</span>
                </Button>
                <Button
                  className="ml-1 flex w-1/2 items-center justify-center rounded border border-miru-red-400 py-2 px-10/100 text-miru-red-400"
                  onClick={() => {
                    setShowDeleteDialog(true);
                  }}
                >
                  <DeleteIcon className="mr-2 text-miru-red-400" size={20} />
                  <span className="font-bold">Delete</span>
                </Button>
              </div>
            ) : null}
          </div>
          <SidePanel.Footer className="sidebar__footer h-auto w-full justify-around px-0">
            {editEntryId ? (
              <Button
                className="w-full p-2 text-center text-base font-bold"
                disabled={!disableApplyBtn}
                style="primary"
                onClick={handleEdit}
              >
                Save Changes
              </Button>
            ) : (
              <Button
                className="w-full p-2 text-center text-base font-bold"
                disabled={!disableApplyBtn || submitting}
                style="primary"
                onClick={() => {
                  setSubmitting(true);
                  handleSave();
                }}
              >
                Add Entry
              </Button>
            )}
          </SidePanel.Footer>
        </SidePanel.Body>
      </SidePanel>
      {showDeleteDialog ? (
        <DeleteEntryModal
          handleDeleteEntry={handleDeleteEntry}
          id={editEntryId}
          setEditEntryId={setEditEntryId}
          setNewEntryView={setNewEntryView}
          setShowDeleteDialog={setShowDeleteDialog}
          showDeleteDialog={showDeleteDialog}
        />
      ) : null}
    </>
  );
};

export default AddEntryMobile;
