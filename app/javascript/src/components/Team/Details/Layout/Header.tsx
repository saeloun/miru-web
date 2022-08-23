import React from "react";

import { ArrowLeft } from "phosphor-react";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();
  return (
    <div className="mt-6 mb-3 sm:flex sm:items-center sm:justify-between">
      <div className="flex items-center ">
        <button className="mr-4" onClick={() => { navigate("/team"); }}><ArrowLeft size={20} /></button>
        <h2 className="header__title">Jane Cooper</h2>
      </div>
    </div>
  );
};
export default Header;
