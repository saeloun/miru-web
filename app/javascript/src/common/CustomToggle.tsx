import React from "react";

type customToggleProps = {
  isChecked: boolean;
  setIsChecked?: React.Dispatch<React.SetStateAction<boolean>>;
  toggleCss: string;
  id: number | string;
  onToggle?: (e?: any) => void; // eslint-disable-line
};

const CustomToggle = ({
  isChecked = false,
  setIsChecked,
  toggleCss,
  id,
  onToggle,
}: customToggleProps) => (
  <div className={`customToggle__container ${toggleCss}`}>
    <label>
      <input
        checked={isChecked}
        className="customToggle"
        id={id.toString()}
        type="checkbox"
        onChange={e => {
          onToggle(e);
          setIsChecked && setIsChecked(!isChecked);
        }}
      />
      <div>
        <div />
      </div>
    </label>
  </div>
);

export default CustomToggle;
