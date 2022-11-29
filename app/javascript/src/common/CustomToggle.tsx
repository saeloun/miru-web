import React from "react";

const CustomToggle = (
  { isChecked = false, setIsChecked, toggleCss, id, onToggle = () => {} } // eslint-disable-line
) => (
  <div className={`customToggle__container ${toggleCss}`}>
    <label>
      <input
        checked={isChecked}
        className="customToggle"
        id={id}
        type="checkbox"
        onChange={() => {
          onToggle();
          setIsChecked(!isChecked);
        }}
      />
      <div>
        <div />
      </div>
    </label>
  </div>
);

export default CustomToggle;
