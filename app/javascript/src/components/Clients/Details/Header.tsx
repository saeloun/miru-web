import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, DotsThreeVertical, Receipt, Pencil, CaretDown, Trash } from "phosphor-react";

const Header = ({ clientDetails }) => {

  const [isHeaderMenuVisible, setHeaderMenuVisibility] = useState<boolean>(false);
  const [isClientOpen, toggleClientDetails] = useState<boolean>(false);

  const navigate = useNavigate();

  const handleClientDetails = () => {
    toggleClientDetails(!isClientOpen);
  };

  const handleMenuVisibility = () => {
    setHeaderMenuVisibility(!isHeaderMenuVisible);
  };

  const handleBackButtonClick = () => {
    navigate("/clients");
  };

  const menuBackground = isHeaderMenuVisible ? "bg-miru-gray-1000" : "";
  return (
    <div className="my-6">
      <div className="flex min-w-0 items-center justify-between">
        <div className="flex items-center">
          <button className="button-icon__back" onClick={handleBackButtonClick}>
            <ArrowLeft size={20} color="#5b34ea" weight="bold" />
          </button>
          <h2 className="text-3xl mr-6 font-extrabold text-gray-900 sm:text-4xl sm:truncate py-1">
            {clientDetails.name}
          </h2>
          <button onClick={handleClientDetails}>
            <CaretDown size={20} weight="bold" />
          </button>
        </div>
        <div className="relative h-8">
          <button onClick = {handleMenuVisibility} className={`menuButton__button ${menuBackground}`}>
            <DotsThreeVertical size={20} color="#000000" />
          </button>
          { isHeaderMenuVisible && <ul className="menuButton__wrapper">
            <li>
              <button className="menuButton__list-item">
                <Receipt size={16} color="#5B34EA" weight="bold" />
                <span className="ml-3">Add Client</span>
              </button>
            </li>
            <li>
              <button className="menuButton__list-item">
                <Pencil size={16} color="#5b34ea" weight="bold" />
                <span className="ml-3">Edit</span>
              </button>
            </li>
            <li>
              <button className="menuButton__list-item text-miru-red-400">
                <Trash size={16} color="#E04646" weight="bold" />
                <span className="ml-3">Delete</span>
              </button>
            </li>
          </ul> }
        </div>
      </div>
      {isClientOpen && <div className="flex ml-12 mt-4">
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
      }
    </div>
  );
};

export default Header;
