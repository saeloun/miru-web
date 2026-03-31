import React, { useState, useRef, useEffect } from "react";

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

import CustomDatePicker from "common/CustomDatePicker";
import { CustomInputText } from "common/CustomInputText";
import { CustomTextareaAutosize } from "common/CustomTextareaAutosize";
import { useUserContext } from "../../../context/UserContext";
import { i18n } from "../../../i18n";

import DeleteEntryModal from "common/DeleteEntryModal";

const AddEntryMobile = ({
  project,
  setProject,
  projects,
  client,
  setClient,
  clients,
  note,
  setNote,
  taskType,
  setTaskType,
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
  const { company } = useUserContext();
  const dateFormat =
    company?.date_format || company?.dateFormat || "MM-DD-YYYY";
  const [showClientList, setShowClientList] = useState<boolean>(false);
  const [clientList, setClientList] = useState<any>(clients);
  const [projectList, setProjectList] = useState<any>(projects[client]);
  const [showProjectList, setShowProjectList] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [projectSearchQuery, setProjectSearchQuery] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [showTaskTypeList, setShowTaskTypeList] = useState<boolean>(false);
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

  const taskTypes = [
    { value: "development", label: i18n.t("taskTypes.development") },
    { value: "meeting", label: i18n.t("taskTypes.meeting") },
    { value: "research", label: i18n.t("taskTypes.research") },
    { value: "planning", label: i18n.t("taskTypes.planning") },
    { value: "testing", label: i18n.t("taskTypes.testing") },
    { value: "documentation", label: i18n.t("taskTypes.documentation") },
    { value: "review", label: i18n.t("taskTypes.codeReview") },
    { value: "debugging", label: i18n.t("taskTypes.debugging") },
    { value: "deployment", label: i18n.t("taskTypes.deployment") },
    { value: "support", label: i18n.t("taskTypes.support") },
    { value: "training", label: i18n.t("taskTypes.training") },
    { value: "other", label: i18n.t("taskTypes.other") },
  ];

  const getTaskTypeLabel = value => {
    const taskType = taskTypes.find(type => type.value === value);

    return taskType ? taskType.label : value;
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
        <SidePanel.Header className="mb-2 flex items-center justify-between bg-primary px-5 py-5 text-white lg:bg-white lg:font-bold lg:text-foreground">
          <span className="flex w-full items-center justify-center pl-6 text-base font-medium leading-5">
            {editEntryId ? i18n.t("timeTracking.editTimeEntry") : i18n.t("timeTracking.newTimeEntry")}
          </span>
          <Button style="ternary" onClick={handleClose}>
            <XIcon className="text-white lg:text-foreground" size={16} />
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
                    label={i18n.t("client")}
                    name="Client"
                    type="text"
                    value={client && client}
                  />
                  <CaretDownIcon
                    className="absolute top-0 bottom-0 right-1 mx-2 my-3 "
                    color="#5E58F1"
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
                          placeholder={i18n.t("search")}
                          type="text"
                          value={searchQuery}
                          className="focus:outline-none w-full rounded bg-muted p-2
            text-sm font-medium focus:border-border focus:ring-1 focus:ring-ring"
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
                          className={`flex items-center px-2 pt-3 text-sm leading-5 text-foreground hover:bg-muted ${
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
                        {i18n.t("timeTracking.selectClient")}
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
                    label={i18n.t("project")}
                    name="Project"
                    type="text"
                    value={project}
                  />
                  <CaretDownIcon
                    className="absolute top-0 bottom-0 right-1 mx-2 my-3 "
                    color="#5E58F1"
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
                          placeholder={i18n.t("search")}
                          type="text"
                          value={projectSearchQuery}
                          className="focus:outline-none w-full rounded bg-muted p-2
            text-sm font-medium focus:border-border focus:ring-1 focus:ring-ring"
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
                          className={`flex items-center px-2 pt-3 text-sm leading-5 text-foreground hover:bg-muted ${
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
                          ? i18n.t("timeTracking.selectProject")
                          : i18n.t("timeTracking.selectClientFirst")}
                      </div>
                    )}
                  </MobileMoreOptions>
                )}
              </div>
              <div className="py-3">
                <CustomTextareaAutosize
                  id="Description"
                  label={i18n.t("description")}
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
                    label={i18n.t("date")}
                    name="date"
                    type="text"
                    value={dayjs(selectedDate).format("MM.DD.YYYY")}
                    onChange={e => {
                      setSelectedDate(e.target.value);
                    }}
                  />
                  <CalendarIcon
                    className="absolute top-0 bottom-0 right-1 mx-2 my-3 "
                    color="#5E58F1"
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
                <div
                  className="relative flex w-full flex-col"
                  onClick={() => {
                    setShowTaskTypeList(true);
                  }}
                >
                  <CustomInputText
                    disabled={showTaskTypeList}
                    id="TaskType"
                    label={i18n.t("timeTracking.taskType")}
                    name="TaskType"
                    type="text"
                    value={getTaskTypeLabel(taskType)}
                  />
                  <CaretDownIcon
                    className="absolute top-0 bottom-0 right-1 mx-2 my-3"
                    color="#5E58F1"
                    size={20}
                    weight="bold"
                  />
                </div>
                {showTaskTypeList && (
                  <MobileMoreOptions
                    className="h-1/2"
                    setVisibilty={setShowTaskTypeList}
                    visibilty={showTaskTypeList}
                  >
                    {taskTypes.map((type, index) => (
                      <li
                        key={index}
                        className={`flex items-center px-2 pt-3 text-sm leading-5 text-foreground hover:bg-muted ${
                          type.value === taskType ? "font-bold" : "font-normal"
                        }`}
                        onClick={() => {
                          setTaskType(type.value);
                          setShowTaskTypeList(false);
                        }}
                      >
                        {type.label}
                      </li>
                    ))}
                  </MobileMoreOptions>
                )}
              </div>
              <div className="flex items-center justify-between rounded border border-border">
                <Button style="ternary" onClick={handleDecreaseTime}>
                  <MinusIcon
                    className="m-4 text-foreground"
                    size={20}
                    weight="bold"
                  />
                </Button>
                <TimeInput
                  className="focus:outline-none w-full max-w-[10rem] cursor-pointer rounded text-center text-xl font-bold text-foreground placeholder:text-muted-foreground focus:border-border focus:bg-white focus:ring-1 focus:ring-ring"
                  initTime={duration}
                  name="timeInput"
                  onTimeChange={handleDurationChange}
                />
                <Button style="ternary" onClick={handleIncreaseTime}>
                  <PlusIcon
                    className="m-4 text-foreground"
                    size={20}
                    weight="bold"
                  />
                </Button>
              </div>
            </div>
            {editEntryId ? (
              <div className="flex w-full items-center gap-2">
                <Button
                  className="flex w-1/2 items-center justify-center py-2"
                  style="secondary"
                  onClick={handleDuplicate}
                >
                  <CopyIcon className="mr-2 text-primary" size={20} />
                  <span className="font-bold">{i18n.t("timeTracking.copyLastWeek")}</span>
                </Button>
                <Button
                  className="flex w-1/2 items-center justify-center rounded border border-destructive py-2 text-destructive"
                  onClick={() => {
                    setShowDeleteDialog(true);
                  }}
                >
                  <DeleteIcon className="mr-2 text-destructive" size={20} />
                  <span className="font-bold">{i18n.t("delete")}</span>
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
                {i18n.t("timeTracking.saveChanges")}
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
                {i18n.t("timeTracking.addEntry")}
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
