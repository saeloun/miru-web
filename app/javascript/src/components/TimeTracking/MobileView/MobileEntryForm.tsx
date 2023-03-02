/* eslint-disable @typescript-eslint/no-var-requires */
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
} from "miruIcons";
import { Button, MobileMoreOptions, SidePanel } from "StyledComponents";

import CustomCheckbox from "common/CustomCheckbox";
import CustomDatePicker from "common/CustomDatePicker";
import { CustomInputText } from "common/CustomInputText";
import CustomReactSelect from "common/CustomReactSelect";
import { CustomTextareaAutosize } from "common/CustomTextareaAutosize";

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
}) => {
  const [showClientList, setShowClientList] = useState<boolean>(false);
  const [clientList, setClientList] = useState<any>(clients);
  const [projectList, setProjectList] = useState<any>(projects[client]);
  const [showProjectList, setShowProjectList] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [projectSearchQuery, setProjectSearchQuery] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
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

  return (
    <SidePanel
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
      <SidePanel.Body className="sidebar__filters flex max-h-80v min-h-80v flex-col justify-between overflow-y-auto px-4">
        <div>
          <div className="py-3">
            <CustomReactSelect
              label="Client"
              menuIsOpen={false}
              name="client_select"
              options={projects[client]}
              value={client && { label: client }}
              handleonFocus={() => {
                setShowClientList(true);
              }}
            />
            {showClientList && (
              <MobileMoreOptions
                className="h-1/2"
                setVisibilty={setShowClientList}
              >
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
                {clientList.map((eachClient, index) => (
                  <li
                    key={index}
                    className={`flex items-center px-2 pt-3 text-sm leading-5 text-miru-dark-purple-1000 hover:bg-miru-gray-100 ${
                      eachClient.name == client ? "font-bold" : "font-normal"
                    }`}
                    onClick={() => {
                      setClient(eachClient.name);
                      setShowClientList(false);
                    }}
                  >
                    {eachClient.name}
                  </li>
                ))}
              </MobileMoreOptions>
            )}
          </div>
          <div className="py-3">
            <CustomReactSelect
              label="Project"
              menuIsOpen={false}
              name="project_select"
              options={projects[client]}
              value={project && { label: project }}
              handleonFocus={() => {
                setShowProjectList(true);
              }}
            />
            {showProjectList && (
              <MobileMoreOptions
                className="h-1/2"
                setVisibilty={setShowProjectList}
              >
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
                {client ? (
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
                      }}
                    >
                      {eachProject.name}
                    </li>
                  ))
                ) : (
                  <div className="mt-5">Please select client.</div>
                )}
              </MobileMoreOptions>
            )}
          </div>
          <div className="py-3">
            <CustomTextareaAutosize
              id="Description (optional)"
              label="Description (optional)"
              name="Description (optional)"
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
                dataCy="date_of_birth"
                id="date_of_birth"
                label="Date of Birth"
                name="date_of_birth"
                type="text"
                value={selectedDate}
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
              id={1}
              isChecked={billable}
              text="Billable"
              wrapperClassName="flex items-center m-auto p-2"
              handleCheck={() => {
                setBillable(!billable);
              }}
            />
          </div>
          <div className="flex items-center justify-between rounded border border-miru-gray-1000">
            <Button onClick={handleDecreaseTime}>
              <MinusIcon
                className="m-4 text-miru-dark-purple-1000"
                size={20}
                weight="bold"
              />
            </Button>
            {duration ? (
              <span className="text-center text-xl font-bold text-miru-dark-purple-1000 ">
                {duration}
              </span>
            ) : (
              <span className="text-center text-xl font-bold text-miru-dark-purple-200 ">
                00:00
              </span>
            )}
            <Button onClick={handleIncreaseTime}>
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
              <CopyIcon className="mr-2 text-miru-han-purple-1000" size={20} />
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
        {showDeleteDialog ? (
          <DeleteEntryModal
            handleDeleteEntry={handleDeleteEntry}
            id={editEntryId}
            setEditEntryId={setEditEntryId}
            setNewEntryView={setNewEntryView}
            setShowDeleteDialog={setShowDeleteDialog}
          />
        ) : null}
      </SidePanel.Body>
      <SidePanel.Footer className="sidebar__footer h-auto w-full justify-around px-4">
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
            disabled={!disableApplyBtn}
            style="primary"
            onClick={handleSave}
          >
            Add Entry
          </Button>
        )}
      </SidePanel.Footer>
    </SidePanel>
  );
};

export default AddEntryMobile;
