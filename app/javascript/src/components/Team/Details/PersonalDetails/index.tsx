import React, { Fragment } from "react";
import { useTeamDetails } from "context/TeamDetailsContext";
import { useEffect } from "react";

const PersonalDetails = () => {
  const { updateDetails, details } = useTeamDetails();

  useEffect(() => {
    updateDetails("personal", {
      name: "Jane Cooper",
      dob: "04. 05. 1989",
      phone: "+123345234",
      email: "jane.cooper@gmail.com"
    })
  }, []);

  console.log("details ----> ", details);
  return (
    <Fragment>
      <div className="px-10 py-4 bg-miru-han-purple-1000 flex items-center justify-between">
        <h1 className="text-white font-bold text-2xl">Personal Details</h1>
      </div>
      <div className="bg-miru-gray-100 px-10 mt-4 h-full">
        <div className="flex py-10 border-b border-b-miru-gray-400">
          <div className="w-1/5">
            <span>Basic Details</span>
          </div>
          <div className="flex w-4/5">
            <div className="w-6/12">
              <h6>Name</h6>
              <p>Jane Cooper</p>
            </div>
            <div className="w-6/12">
              <h6>Date of Birth</h6>
              <p>04. 05. 1989</p>
            </div>
          </div>
        </div>
        <div className="flex py-10 border-b border-b-miru-gray-400">
          <div className="w-1/5">
            <span>Contact Details</span>
          </div>
          <div className="w-4/5">
            <div className="flex">
              <div className="w-6/12">
                <h6>Phone Number</h6>
                <p>+123345234</p>
              </div>
              <div className="w-6/12">
                <h6>Email ID (Personal)</h6>
                <p>jane.cooper@gmail.com</p>
              </div>
            </div>
            <div>
              <h6>Address</h6>
              <p>284/6-7, Sri Ranga Complex, Ground Floor Main Road, Chickpet, Bangalore, Karnataka - 560053</p>
            </div>
          </div>
        </div>
        <div className="flex py-10">
          <div className="w-1/5">
            <span>Social Profiles</span>
          </div>
          <div className="flex w-4/5">
            <div className="w-6/12">
              <h6>LinkedIn</h6>
              <p>www.linkedin.com/janecooper</p>
            </div>
            <div className="w-6/12">
              <h6>Github</h6>
              <p>www.github.com/janecooper</p>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
}
export default PersonalDetails;
