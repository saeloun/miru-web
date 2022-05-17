import React from "react";

const CustomToggle = ({ isChecked = false, setIsChecked, toggleCss, id }) => (
  <div className={`customToggle__container ${toggleCss}`}>
    <label>
      <input
        id={id}
        className="customToggle"
        type="checkbox"
        onChange={()=> setIsChecked(!isChecked) }
        checked={isChecked}
      />
      <div>
        <div></div>
      </div>
    </label>
  </div>
);

export default CustomToggle;
