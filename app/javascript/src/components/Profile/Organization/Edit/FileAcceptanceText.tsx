import React, { Fragment } from "react";

const filetext = `Accepted file formats: PNG, JPG, SVG.
File size should be < 2MB`;

const FileAcceptanceText = () => <Fragment>{filetext}</Fragment>;

export default React.memo(FileAcceptanceText);
