import React from "react";

import { Switch as HeadlessSwitch } from "@headlessui/react";
import classNames from "classnames";

const Switch = ({ enabled, onChange }) => (
  <HeadlessSwitch
    checked={enabled}
    className={classNames(
      enabled ? "bg-indigo-600" : "bg-gray-200",
      "focus:outline-none relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
    )}
    onChange={onChange}
  >
    <span
      aria-hidden="true"
      className={classNames(
        enabled ? "translate-x-5" : "translate-x-0",
        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
      )}
    />
  </HeadlessSwitch>
);

export default Switch;
