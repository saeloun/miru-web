import React, { Fragment } from "react";
import { ToastContainer } from "react-toastify";
import Table from "./Table";
import { TOASTER_DURATION } from "../../../constants/index";

export const ProjectList = () => (
  <Fragment>
    <ToastContainer autoClose={TOASTER_DURATION} />
    <div>
      <div className="table__flex">
        <div className="table__position-one">
          <div className="table__position-two">
            <div className="table__border border-b-0 border-miru-gray-200">
              <Table />
            </div>
          </div>
        </div>
      </div>
    </div>
  </Fragment>
);

export default ProjectList;
