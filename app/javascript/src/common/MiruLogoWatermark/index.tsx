import React from "react";

import { MiruLogoWatermarkSVG } from "miruIcons";

const MiruLogoWatermark = () => (
  <div className="absolute bottom-0 left-0 z-negative-1 hidden w-2/5 lg:block lg:w-1/6">
    <img className="w-full object-contain" src={MiruLogoWatermarkSVG} />
  </div>
);

export default MiruLogoWatermark;
