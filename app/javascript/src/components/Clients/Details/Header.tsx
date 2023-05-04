import React, { useState } from "react";

import {
  ArrowLeftIcon,
  DotsThreeVerticalIcon,
  ReportsIcon,
  PencilIcon,
  DeleteIcon,
  PlusIcon,
  EditIcon,
  InfoIcon,
} from "miruIcons";
import { useNavigate } from "react-router-dom";
import { MobileMoreOptions, Modal } from "StyledComponents";

import { useUserContext } from "context/UserContext";

import DeleteClient from "../Modals/DeleteClient";
import EditClient from "../Modals/EditClient";

const Header = ({ clientDetails, setShowProjectModal }) => {
  const [isHeaderMenuVisible, setIsHeaderMenuVisible] =
    useState<boolean>(false);
  const [isClientOpen, setIsClientOpen] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false);
  const [showMobileModal, setShowMobileModal] = useState<boolean>(false);

  const navigate = useNavigate();
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

  const menuBackground = isHeaderMenuVisible ? "bg-miru-gray-1000" : "";

  return (
    <div className="my-6">
      <div className="flex min-w-0 items-center justify-between">
        <div className="flex items-center">
          <button className="button-icon__back" onClick={handleBackButtonClick}>
            <ArrowLeftIcon color="#5b34ea" size={20} weight="bold" />
          </button>
          <h2 className="mr-6 py-1 text-3xl font-extrabold text-gray-900 sm:truncate sm:text-4xl">
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
            <DotsThreeVerticalIcon color="#000000" size={20} />
          </button>
          {isHeaderMenuVisible && (
            <ul className="menuButton__wrapper">
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
              <p className="font-semibold">Email ID(s)</p>
              <p className="mt-1 text-miru-dark-purple-400">
                {clientDetails.email}
              </p>
            </div>
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
        />
      )}
      {showEditDialog && (
        <EditClient
          client={clientDetails}
          setShowEditDialog={setShowEditDialog}
        />
      )}
      {showMobileModal && (
        <MobileMoreOptions setVisibilty={setShowMobileModal}>
          <li
            className="menuButton__list-item"
            onClick={() => {
              handleAddProject();
              setShowMobileModal(false);
            }}
          >
            <PlusIcon />
            <span className="ml-3">Add new project</span>
          </li>
          <li
            className="menuButton__list-item"
            onClick={() => {
              handleEdit();
              setShowMobileModal(false);
            }}
          >
            <EditIcon color="#5B34EA" size={16} />
            <span className="ml-3">Edit</span>
          </li>
          <li
            className="menuButton__list-item"
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
