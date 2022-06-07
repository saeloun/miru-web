import React from "react";

const CustomToggle = ({ isChecked = false, setIsChecked, toggleCss, id, onToggle = () => {}}) => ( // eslint-disable-line
  <div className={`customToggle__container ${toggleCss}`}>
    <label>
      <input
        id={id}
        className="customToggle"
        type="checkbox"
        onChange={() => {
          onToggle();
          setIsChecked(!isChecked);
        }}
        checked={isChecked}
      />
      <div>
        <div></div>
      </div>
    </label>
  </div>
);

export default CustomToggle;
