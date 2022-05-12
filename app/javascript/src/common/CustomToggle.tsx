import React from "react";

const CustomToggle = ({ isChecked = false, setIsChecked, toggleCss, id }) => (
  <div className={`CustomToggle_Container ${toggleCss}`}>
    <label>
      <input
        id={id}
        className="toggle"
        type="checkbox"
        onChange={() => setIsChecked(!isChecked)}
        checked={isChecked}
      />
      <div>
        <div></div>
      </div>
    </label>
  </div>
);

export default CustomToggle;
