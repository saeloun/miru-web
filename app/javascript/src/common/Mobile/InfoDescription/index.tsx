import React from "react";

export const InfoDescription = ({
  wrapperClassName = "w-full",
  titleClassName = "text-xs font-normal py-1",
  descriptionClassName = "font-medium	text-base pb-1",
  title,
  description,
}) => (
  <div className={wrapperClassName}>
    <div className={titleClassName}>{title}</div>
    <div className={descriptionClassName}>{description}</div>
  </div>
);
