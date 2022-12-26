import React from "react";

const StaticPage = () => (
  <div className="mt-4 h-full bg-miru-gray-100 px-10">
    <div className="flex border-b border-b-miru-gray-400 py-10">
      <div className="w-1/5 pr-4">
        <span className="text-sm font-medium text-miru-dark-purple-1000">
          Current Employement
        </span>
      </div>
      <div className="w-4/5">
        <div className="flex">
          <div className="w-6/12">
            <span className="text-xs text-miru-dark-purple-1000">
              Employee ID
            </span>
            <p className="text-miru-dark-purple-1000">SI0007</p>
          </div>
          <div className="w-6/12">
            <span className="text-xs text-miru-dark-purple-1000">
              Designation
            </span>
            <p className="text-miru-dark-purple-1000">
              Senior Software Developer
            </p>
          </div>
        </div>
        <div className="mt-4 flex">
          <div className="w-6/12">
            <span className="text-xs text-miru-dark-purple-1000">
              Email ID (Official)
            </span>
            <p className="text-miru-dark-purple-1000">jane@saeloun.com</p>
          </div>
          <div className="w-6/12">
            <span className="text-xs text-miru-dark-purple-1000">
              Employee Type
            </span>
            <p className="text-miru-dark-purple-1000">Salaried Employee</p>
          </div>
        </div>
        <div className="mt-4 flex">
          <div className="w-6/12">
            <span className="text-xs text-miru-dark-purple-1000">
              Date of Joining
            </span>
            <p className="text-miru-dark-purple-1000">01. 08. 2021</p>
          </div>
          <div className="w-6/12">
            <span className="text-xs text-miru-dark-purple-1000">
              Date of Resignation
            </span>
            <p className="text-miru-dark-purple-1000">--</p>
          </div>
        </div>
      </div>
    </div>
    <div className="flex py-10">
      <div className="w-1/5 pr-4">
        <span className="text-sm font-medium text-miru-dark-purple-1000">
          Previous Employement
        </span>
      </div>
      <div className="w-4/5">
        <div className="flex">
          <div className="w-6/12">
            <span className="text-xs text-miru-dark-purple-1000">Company</span>
            <p className="text-miru-dark-purple-1000">Infosys</p>
          </div>
          <div className="w-6/12">
            <span className="text-xs text-miru-dark-purple-1000">Role</span>
            <p className="text-miru-dark-purple-1000">Software Developer</p>
          </div>
        </div>
        <div className="mt-4 flex">
          <div className="w-6/12">
            <span className="text-xs text-miru-dark-purple-1000">Company</span>
            <p className="text-miru-dark-purple-1000">Infosys</p>
          </div>
          <div className="w-6/12">
            <span className="text-xs text-miru-dark-purple-1000">Role</span>
            <p className="text-miru-dark-purple-1000">Software Developer</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default StaticPage;
