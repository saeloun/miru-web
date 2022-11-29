import React, { useState } from "react";

import {
  ArrowLeftIcon,
  DotsThreeVerticalIcon,
  ReportsIcon,
  PencilIcon,
  CaretDownIcon,
  DeleteIcon,
} from "miruIcons";
import { useNavigate } from "react-router-dom";

import AddProject from "../Modals/AddProject";
import DeleteClient from "../Modals/DeleteClient";
import EditClient from "../Modals/EditClient";

const Header = ({ clientDetails }) => {
  const [isHeaderMenuVisible, setIsHeaderMenuVisible] =
    useState<boolean>(false);
  const [isClientOpen, setIsClientOpen] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false);
  const [showProjectModal, setShowProjectModal] = useState<boolean>(false);

  const navigate = useNavigate();

  const handleClientDetails = () => {
    setIsClientOpen(!isClientOpen);
  };

  const handleMenuVisibility = () => {
    setIsHeaderMenuVisible(!isHeaderMenuVisible);
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
            <CaretDownIcon size={20} weight="bold" />
          </button>
        </div>
        <div className="relative h-8">
          <button
            className={`menuButton__button ${menuBackground}`}
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
        <div className="ml-12 mt-4 flex">
          <div className="text-xs text-miru-dark-purple-400">
            <h6 className="font-semibold">Email ID(s)</h6>
            <p>{clientDetails.email}</p>
          </div>
          <div className="ml-28 text-xs text-miru-dark-purple-400">
            <h6 className="font-semibold">Address</h6>
            <p>{clientDetails.address}</p>
          </div>
          <div className="ml-28 text-xs text-miru-dark-purple-400">
            <h6 className="font-semibold">Phone number</h6>
            <p>{clientDetails.phone}</p>
          </div>
        </div>
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
      {showProjectModal && (
        <AddProject
          clientDetails={clientDetails}
          setShowProjectModal={setShowProjectModal}
        />
      )}
    </div>
  );
};

export default Header;
