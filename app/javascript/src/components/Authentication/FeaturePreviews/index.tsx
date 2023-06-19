import React from "react";

import { BlurredMiruLogo } from "miruIcons";
import ReactPlayer from "react-player";
import { Carousel } from "react-responsive-carousel";

import { MIRU_APP_URL } from "constants/index";

import { carouselItems } from "./utils";

const FeaturePreviews = () => (
  <div className="hidden min-h-full bg-miru-han-purple-1000 md:w-1/2 lg:block">
    <a href={MIRU_APP_URL} rel="noreferrer noopener">
      <div className="absolute right-10 top-10 z-10">
        <img alt="" height="64" src={BlurredMiruLogo} width="64" />
      </div>
    </a>
    <div
      className="mx-auto h-full w-8/12 items-center justify-center"
      id="feature-carousel"
    >
      <Carousel
        autoPlay
        infiniteLoop
        dynamicHeight={false}
        interval={5000}
        showArrows={false}
        showStatus={false}
        showThumbs={false}
      >
        {carouselItems?.map((feature, i) => (
          <div className="flex h-full w-full flex-col justify-between" key={i}>
            {feature.type == "image" ? (
              <div className="player-wrapper mb-4 h-3/4 w-full">
                <img
                  className="h-full w-full"
                  src={feature.image}
                  style={{ boxShadow: "0px 0px 32px rgba(0, 0, 0, 0.1)" }}
                />
              </div>
            ) : (
              <div className="player-wrapper mb-4 h-full w-full">
                <ReactPlayer
                  loop
                  muted
                  playing
                  className="react-player object-contain"
                  height="100%"
                  url={feature.url}
                  width="100%"
                />
              </div>
            )}
            <div className="h-1/5">
              <h2 className="mb-auto font-manrope text-2vh font-semibold not-italic text-miru-white-1000">
                {feature.texts.title}
              </h2>
              <p className="mb-auto font-manrope text-xs font-normal not-italic text-miru-white-1000">
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
