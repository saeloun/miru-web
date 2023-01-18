import React from "react";

import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";

import { carouselItems } from "./utils";

const FeaturePreviews = () => (
  <div className="hidden min-h-full bg-miru-han-purple-1000 md:w-1/2 md:pt-40 lg:block">
    <div className="mx-auto w-7/12 md:pt-20">
      <Carousel
        autoPlay
        infiniteLoop
        showArrows={false}
        showStatus={false}
        showThumbs={false}
      >
        {carouselItems?.map((feature, i) => (
          <div key={i}>
            <img
              className="h-300 mb-4 w-480 object-contain"
              src={feature.image}
              style={{ boxShadow: "0px 0px 32px rgba(0, 0, 0, 0.1)" }}
            />
            <div>
              <h2 className="mb-3 font-manrope text-2xl font-semibold not-italic text-miru-white-1000">
                {feature.texts.title}
              </h2>
              <p className="mb-10 font-manrope text-xs font-normal not-italic text-miru-white-1000">
                {feature.texts.description}
              </p>
            </div>
          </div>
        ))}
      </Carousel>
    </div>
  </div>
);
export default FeaturePreviews;
