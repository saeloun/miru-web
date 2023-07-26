import React from "react";

const Switch = ({ toggle, setToggle }) => {
  const toggleClass = " transform translate-x-full";

  return (
    <div
      className={`flex h-6 w-12 cursor-pointer items-center rounded-full ${
        toggle ? "bg-miru-han-purple-600" : "bg-gray-300"
      } p-1 md:h-7 md:w-14`}
      onClick={() => setToggle(!toggle)}
    >
      <div
        className={`h-5 w-5 transform rounded-full bg-white shadow-md duration-300 ease-in-out md:h-6 md:w-6 ${
          toggle ? toggleClass : null
        }`}
      />
    </div>
  );
};

export default Switch;
