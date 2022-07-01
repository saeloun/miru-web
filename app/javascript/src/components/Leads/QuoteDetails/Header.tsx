import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CaretDown } from "phosphor-react";

const Header = ({ leadDetails }) => {

  const [isLeadOpen, toggleLeadDetails] = useState<boolean>(false);

  const navigate = useNavigate();

  const { leadId } = useParams();

  const handleLeadDetails = () => {
    toggleLeadDetails(!isLeadOpen);
  };

  const handleBackButtonClick = () => {
    navigate(`/leads/${leadId}/quotes`);
  };

  useEffect(() => {
    toggleLeadDetails(!isLeadOpen);
  }, []);

  return (
    <div className="my-6">
      <div className="flex min-w-0 items-center justify-between">
        <div className="flex items-center">
          <button className="button-icon__back" onClick={handleBackButtonClick}>
            <ArrowLeft size={20} color="#0033CC" weight="bold" />
          </button>
          <h2 className="text-3xl mr-6 font-extrabold text-gray-900 sm:text-4xl sm:truncate py-1">
            {leadDetails.name}
          </h2>
          <button onClick={handleLeadDetails}>
            <CaretDown size={20} weight="bold" />
          </button>
        </div>
      </div>
      {isLeadOpen && <div className="flex ml-12 mt-4">
        <div className="text-xs text-miru-dark-purple-400">
          <h6 className="font-semibold">Description</h6>
          <p>{leadDetails.description}</p>
        </div>
      </div>
      }
    </div>
  );
};

export default Header;
