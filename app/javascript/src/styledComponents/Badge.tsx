import React from "react";

import classnames from "classnames";
import PropTypes from "prop-types";

const DEFAULT_STYLE = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold leading-4 tracking-wider text-purple-800 bg-purple-100";

const Badge = ({
  text = null,
  color = "",
  bgColor = "",
  className = ""
}) => (
  <span className={classnames(DEFAULT_STYLE, color, bgColor, className)}>
    {text || "Badge"}
  </span>
);

Badge.propTypes = {
  text: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ]),
  color: PropTypes.string,
  bgColor: PropTypes.string,
  className: PropTypes.string
};

export default Badge;
