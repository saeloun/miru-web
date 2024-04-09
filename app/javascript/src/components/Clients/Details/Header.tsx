import React, { useRef, useState } from "react";

import { useOutsideClick } from "helpers";
import {
  ArrowLeftIcon,
  DotsThreeVerticalIcon,
  ReportsIcon,
  PencilIcon,
  DeleteIcon,
  PlusIcon,
  EditIcon,
  InfoIcon,
  ReminderIcon,
  TeamsIcon,
} from "miruIcons";
import { useNavigate } from "react-router-dom";
import { MobileMoreOptions, Modal } from "StyledComponents";

import { useUserContext } from "context/UserContext";

// import AddContacts from "../Modals/AddContacts";
import Contacts from "../Contacts";
import DeleteClient from "../Modals/DeleteClient";
import EditClient from "../Modals/EditClient";

const Header = ({
  clientDetails,
  setShowProjectModal,
  fetchDetails,
  setSendPaymentReminder,
}) => {
  const [isHeaderMenuVisible, setIsHeaderMenuVisible] =
    useState<boolean>(false);
  const [isClientOpen, setIsClientOpen] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false);
  const [showMobileModal, setShowMobileModal] = useState<boolean>(false);
  const [showContactModal, setShowContactModal] = useState<boolean>(false);

  const navigate = useNavigate();
  const menuRef = useRef();
  const { isDesktop } = useUserContext();

  const handleClientDetails = () => {
    setIsClientOpen(!isClientOpen);
  };

  const handleMenuVisibility = () => {
    if (isDesktop) {
      setIsHeaderMenuVisible(!isHeaderMenuVisible);
    } else {
      setShowMobileModal(!showMobileModal);
    }
  };

  const handleBackButtonClick = () => {
    navigate("/clients");
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const handleEdit = () => {
    setShowEditDialog(true);
  };

  const handleAddProject = () => {
    setShowProjectModal(true);
    setIsHeaderMenuVisible(false);
  };

  useOutsideClick(menuRef, () => setIsHeaderMenuVisible(false));

  const menuBackground = isHeaderMenuVisible ? "bg-miru-gray-100" : "";

  return (
    <div className="lg:my-6">
      <div className="flex h-12 min-w-0 items-center justify-between shadow-c1 lg:h-auto lg:shadow-none">
        <div className="flex items-center">
          <button className="button-icon__back" onClick={handleBackButtonClick}>
            <ArrowLeftIcon
              className="text-miru-dark-purple-1000"
              size={20}
              weight="bold"
            />
          </button>
          <h2 className="mr-6 py-1 text-base font-medium text-miru-dark-purple-1000 sm:truncate lg:text-4xl lg:font-extrabold">
            {clientDetails.name}
          </h2>
          <button onClick={handleClientDetails}>
            <InfoIcon size={20} weight="bold" />
          </button>
        </div>
        <div className="relative h-8">
          <button
            className={`menuButton__button ${menuBackground}`}
            id="kebabMenu"
            onClick={handleMenuVisibility}
          >
            <DotsThreeVerticalIcon color="#000000" size={20} weight="bold" />
          </button>
          {isHeaderMenuVisible && (
            <ul className="menuButton__wrapper" ref={menuRef}>
              <li onClick={handleAddProject}>
                <button className="menuButton__list-item">
                  <ReportsIcon color="#5B34EA" size={16} weight="bold" />
                  <span className="ml-3">Add Project</span>
                </button>
              </li>
              <li onClick={handleEdit}>
                <button className="menuButton__list-item">
                  <PencilIcon color="#5b34ea" size={16} weight="bold" />
                  <span className="ml-3">Edit</span>
                </button>
              </li>
              <li onClick={() => setSendPaymentReminder(true)}>
                <button className="menuButton__list-item">
                  <ReminderIcon id="reminderIcon" size={16} />
                  <span className="ml-3">Payment Reminder</span>
                </button>
              </li>
              <li
                onClick={() => {
                  setShowContactModal(true);
                  setIsHeaderMenuVisible(false);
                }}
              >
                <button className="menuButton__list-item">
                  <TeamsIcon size={16} />
                  <span className="ml-3">Add / View Contacts</span>
                </button>
              </li>
              <li onClick={handleDelete}>
                <button className="menuButton__list-item text-miru-red-400">
                  <DeleteIcon color="#E04646" size={16} weight="bold" />
                  <span className="ml-3">Delete</span>
                </button>
              </li>
            </ul>
          )}
        </div>
      </div>
      {isClientOpen && (
        <Modal isOpen={isClientOpen} onClose={() => setIsClientOpen(false)}>
          <div>
            <p className="text-lg font-bold">Client Details</p>
            <div className="mt-4 text-base">
              <p className=" font-semibold">Address</p>
              <div className="mt-1 text-miru-dark-purple-400">
                <p>{clientDetails.address.address_line_1}</p>
                <p>{clientDetails.address?.address_line_2}</p>
                <p>{clientDetails.address?.city}</p>
                <p>{clientDetails.address?.country}</p>
              </div>
            </div>
            <div className="mt-4 text-base">
              <p className="font-semibold">Phone number</p>
              <p className="mt-1 text-miru-dark-purple-400">
                {clientDetails.phone}
              </p>
            </div>
          </div>
        </Modal>
      )}
      {showDeleteDialog && (
        <DeleteClient
          client={clientDetails}
          setShowDeleteDialog={setShowDeleteDialog}
          showDeleteDialog={showDeleteDialog}
        />
      )}
      {showEditDialog && (
        <EditClient
          client={clientDetails}
          fetchDetails={fetchDetails}
          setShowEditDialog={setShowEditDialog}
          showEditDialog={showEditDialog}
        />
      )}
      {showContactModal && (
        <Contacts
          clientDetails={clientDetails}
          isContactOpen={showContactModal}
          setIsContactOpen={setShowContactModal}
        />
      )}
      {showMobileModal && (
        <MobileMoreOptions
          setVisibilty={setShowMobileModal}
          visibilty={showMobileModal}
        >
          <li
            className="menuButton__list-item px-0"
            onClick={() => {
              handleAddProject();
              setShowMobileModal(false);
            }}
          >
            <PlusIcon />
            <span className="ml-3">Add new project</span>
          </li>
          <li
            className="menuButton__list-item px-0"
            onClick={() => {
              setSendPaymentReminder(true);
              setShowMobileModal(false);
            }}
          >
            <ReminderIcon id="reminderIcon" size={16} />
            <span className="ml-3">Payment Reminder</span>
          </li>
          <li
            onClick={() => {
              setShowContactModal(true);
              setShowMobileModal(false);
            }}
          >
            <button className="menuButton__list-item px-0">
              <TeamsIcon size={16} />
              <span className="ml-3">Add / View Contacts</span>
            </button>
          </li>
          <li
            className="menuButton__list-item px-0"
            onClick={() => {
              handleEdit();
              setShowMobileModal(false);
            }}
          >
            <EditIcon color="#5B34EA" size={16} />
            <span className="ml-3">Edit</span>
          </li>
          <li
            className="menuButton__list-item px-0"
            onClick={() => {
              handleDelete();
              setShowMobileModal(false);
            }}
          >
            <DeleteIcon color="#E04646" size={16} />
            <span className="ml-3">Delete</span>
          </li>
        </MobileMoreOptions>
      )}
    </div>
  );
};

export default Header;
