import React, { Fragment } from "react";

const fileAcceptanceConditions: string[] = [
  "Accepted file formats: PNG, JPG, SVG",
  "File size should be <2MB.",
  "Image resolution should be 1:1.",
];

const FileAcceptanceText = () => (
  <Fragment>
    {fileAcceptanceConditions.map(acceptanceConditionText => (
      <p key={acceptanceConditionText}>{acceptanceConditionText}</p>
    ))}
  </Fragment>
);

export default React.memo(FileAcceptanceText);
