import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import candidate from "apis/candidates";
import CandidateSettings from "./CandidateSettings";
import Header from "./Header";
import Tab from "./Tab";
import { TOASTER_DURATION } from "../../../../constants/index";
import { unmapCandidateDetails } from "../../../../mapper/candidate.mapper";

interface IDetailsProps {
  id?: number|string
  basePath?: string
}

const Details: React.FC<IDetailsProps> = ({ id, basePath="" }) => {
  const [candidateDetails, setCandidateDetails] = useState<any>({});
  const [showCandidateSetting, setShowCandidateSetting] = useState<boolean>(false);
  const [forItem, setForItem] = useState<string>("summary");
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [formRef, setFormRef]  = useState<any>(React.createRef());
  const { candidateId } = useParams();

  useEffect(() => {
    (candidateId) && candidate.show(id)
      .then((res) => {
        const sanitized = unmapCandidateDetails(res);
        setCandidateDetails(sanitized.candidateDetails);
      });
  }, [location.pathname]);

  // useEffect(() => {
  //   candidate.show(id)
  //     .then((res) => {
  //       const sanitized = unmapCandidateDetails(res);
  //       setCandidateDetails(sanitized.candidateDetails);
  //     });
  // }, [id]);

  const submitCandidateForm = () => {
    formRef.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true })
    )
  };

  const resetCandidateForm = () => {
    formRef.dispatchEvent(
      new Event("reset", { bubbles: true, cancelable: true })
    )
  };

  return (
    <React.Fragment>
      <ToastContainer autoClose={TOASTER_DURATION} />
      <Header candidateDetails={candidateDetails} setShowCandidateSetting={setShowCandidateSetting} submitCandidateForm={submitCandidateForm} resetCandidateForm={resetCandidateForm} forItem={forItem} isEdit={isEdit} setIsEdit={setIsEdit} basePath={basePath} />
      <Tab
        candidateDetails={candidateDetails}
        setCandidateDetails={setCandidateDetails}
        setForItem={setForItem}
        isEdit={isEdit}
        setIsEdit={setIsEdit}
        setFormRef={setFormRef}
        basePath={basePath}
      />
      {showCandidateSetting && (
        <CandidateSettings candidateDetails={candidateDetails} setCandidateDetails={setCandidateDetails} setShowCandidateSetting={setShowCandidateSetting} />
      )}
    </React.Fragment>
  );
};

export default Details;
