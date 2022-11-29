import React from "react";

const StaticPage = () => (
  <div className="mt-4 h-full bg-miru-gray-100 px-10">
    <div className="flex border-b border-b-miru-gray-400 py-10">
      <div className="w-1/5 pr-4">
        <span className="text-sm font-medium text-miru-dark-purple-1000">
          Basic Details
        </span>
      </div>
      <div className="w-4/5">
        <div className="flex">
          <div className="w-6/12">
            <span className="text-xs text-miru-dark-purple-1000">Name</span>
            <p className="text-miru-dark-purple-1000">Jane Cooper</p>
          </div>
          <div className="w-6/12">
            <span className="text-xs text-miru-dark-purple-1000">
              Date of Birth
            </span>
            <p className="text-miru-dark-purple-1000">04. 05. 1989</p>
          </div>
        </div>
      </div>
    </div>
    <div className="flex border-b border-b-miru-gray-400 py-10">
      <div className="w-1/5 pr-4">
        <span className="text-sm font-medium text-miru-dark-purple-1000">
          Contact Details
        </span>
      </div>
      <div className="w-4/5">
        <div className="flex">
          <div className="w-6/12">
            <span className="text-xs text-miru-dark-purple-1000">
              Phone Number
            </span>
            <p className="text-miru-dark-purple-1000">+123345234</p>
          </div>
          <div className="w-6/12">
            <span className="text-xs text-miru-dark-purple-1000">
              Email ID (Personal)
            </span>
            <p className="text-miru-dark-purple-1000">jane.cooper@gmail.com</p>
          </div>
        </div>
        <div className="mt-4 flex">
          <div className="w-full">
            <span className="text-xs text-miru-dark-purple-1000">Address</span>
            <p className="text-miru-dark-purple-1000">
              284/6-7, Sri Ranga Complex, Ground Floor Main Road, Chickpet,
              Bangalore, Karnataka - 560053
            </p>
          </div>
        </div>
      </div>
    </div>
    <div className="flex py-10">
      <div className="w-1/5 pr-4">
        <span className="text-sm font-medium text-miru-dark-purple-1000">
          Social Profiles
        </span>
      </div>
      <div className="w-4/5">
        <div className="flex">
          <div className="w-6/12">
            <span className="text-xs text-miru-dark-purple-1000">LinkedIn</span>
            <p className="text-miru-dark-purple-1000">
              www.linkedin.com/janecooper
            </p>
          </div>
          <div className="w-6/12">
            <span className="text-xs text-miru-dark-purple-1000">Github</span>
            <p className="text-miru-dark-purple-1000">
              www.github.com/janecooper
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default StaticPage;
