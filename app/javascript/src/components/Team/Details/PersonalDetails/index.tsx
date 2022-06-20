import React, { useEffect, useState } from "react";
import { useTeamDetails } from "context/TeamDetailsContext";
import FormPage from "./FormPage";
import StaticPage from "./StaticPage";

const PersonalDetails = () => {
  const { updateDetails } = useTeamDetails();
  const [isFormVisible, setFormVisible] = useState(false);

  useEffect(() => {
    updateDetails("personal", {
      name: "Jane Cooper",
      dob: "04. 05. 1989",
      phone: "+123345234",
      email: "jane.cooper@gmail.com"
    });
  }, []);

  return isFormVisible ? <FormPage setFormVisible={setFormVisible} /> : <StaticPage setFormVisible={setFormVisible} />;

};
export default PersonalDetails;
