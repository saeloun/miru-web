import React, { useState, useEffect } from "react";

import { X, Pencil, FloppyDisk, ArrowLeft, CaretDown, Trash, Gear } from "phosphor-react";
import { useNavigate } from "react-router-dom";

import { setAuthHeaders, registerIntercepts } from "apis/axios";
import candidates from "apis/candidates";

import { unmapCandidateList } from "../../../../mapper/candidate.mapper";
import getStatusCssClass from "../../../../utils/getBadgeStatus";
import DeleteCandidate from "../../Modals/DeleteCandidate";

const Header = ({
  candidateDetails,
  setShowCandidateSetting,
  submitCandidateForm,
  resetCandidateForm,
  forItem,
  isEdit,
  setIsEdit
}) => {

  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [candidateToDelete, setDelete] = useState({});
  const [candidateData, setCandidateData] = useState<any>();

  const [isHeaderMenuVisible, setHeaderMenuVisibility] = useState<boolean>(false);
  const [isCandidateOpen, toggleCandidateDetails] = useState<boolean>(false);

  const navigate = useNavigate();

  const wrapperRef = React.useRef(null);

  const closeOpenHeaderMenu = (e: Event)=>{
    if (wrapperRef.current && isHeaderMenuVisible && !wrapperRef.current.contains(e.target)){
      setHeaderMenuVisibility(false)
    }
  };

  document.addEventListener('click',closeOpenHeaderMenu)

  const handleDeleteClick = (id: number) => {
    setShowDeleteDialog(true);
    const editSelection = candidateData.find((candidate: any) => candidate.id === id);
    setDelete(editSelection);
  };

  const handleCandidateDetails = () => {
    toggleCandidateDetails(!isCandidateOpen);
  };

  const handleBackButtonClick = () => {
    navigate('/recruitment/candidates');
  };

  useEffect(() => {
    toggleCandidateDetails(!isCandidateOpen);
    setAuthHeaders();
    registerIntercepts();
    candidates.get("")
      .then((res) => {
        const sanitized = unmapCandidateList(res);
        setCandidateData(sanitized.recruitmentCandidate);
      });
  }, []);

  return (
    <>
      <div className="my-6">
        <div className="flex items-center justify-between min-w-0">
          <div className="flex items-center">
            <button className="button-icon__back" onClick={handleBackButtonClick}>
              <ArrowLeft size={20} className="text-col-han-app-1000" weight="bold" />
            </button>
            {(candidateDetails.discarded_at) ? (<h2 className="py-1 mr-6 text-3xl font-extrabold text-red-600 sm:text-4xl sm:truncate">
              {candidateDetails.name}
            </h2>) : (<h2 className="py-1 mr-6 text-3xl font-extrabold text-gray-900 sm:text-4xl sm:truncate">
              {candidateDetails.name}
            </h2>)}
            <button onClick={handleCandidateDetails}>
              <CaretDown size={20} weight="bold" />
            </button>
            {forItem === "summary" &&
              candidateDetails.discarded_at ?
              <button
                onClick={() => setShowCandidateSetting(true)}
                className="flex items-center ml-5 text-xs font-bold leading-4 tracking-widest text-red-800"
              >
                <Gear size={15} className="mr-2.5 text-red-800" />
                  SETTINGS
              </button> : <button
                onClick={() => setShowCandidateSetting(true)}
                className="flex items-center ml-5 text-xs font-bold leading-4 tracking-widest text-col-han-app-1000"
              >
                <Gear size={15} className="mr-2.5 text-col-han-app-1000" />
                SETTINGS
              </button>
            }
          </div>
          {forItem === "summary" &&
            <>
              <div className="flex justify-end w-2/5">
                {isEdit ?
                  <>
                    <button
                      type="button"
                      className="w-1/3 p-0 header__button"
                      onClick={() => { resetCandidateForm(); setIsEdit(false); } }
                    >
                      <X size={12} />
                      <span className="inline-block ml-2">CANCEL</span>
                    </button>
                    <button
                      type="button"
                      className="w-1/3 p-0 text-white header__button bg-col-han-app-1000 hover:text-white"
                      onClick={() => { submitCandidateForm(); setIsEdit(false); } }
                    >
                      <FloppyDisk size={18} color="white" />
                      <span className="inline-block ml-2">SAVE</span>
                    </button>
                  </>
                  : (candidateDetails.discarded_at ? <button
                    type="button"
                    className="w-1/3 p-0 text-white bg-red-800 header__button hover:text-white"
                    onClick={() => setIsEdit(true)}
                  >
                    <Pencil size={18} color="white" />
                    <span className="inline-block ml-2">EDIT</span>
                  </button> : <button
                    type="button"
                    className="w-1/3 p-0 text-white header__button bg-col-han-app-1000 hover:text-white"
                    onClick={() => setIsEdit(true)}
                  >
                    <Pencil size={18} color="white" />
                    <span className="inline-block ml-2">EDIT</span>
                  </button>)
                }
                {
                  candidateDetails.discarded_at ? null :
                    <button
                      className="w-1/3 p-0 header__button text-col-red-400 hover:text-col-red-400" onClick={() => handleDeleteClick(candidateDetails.id)}>
                      <Trash size={16} className="text-col-red-400" weight="bold" />
                      <span className="ml-3">Delete</span>
                    </button>
                }
              </div>
            </>
          }
        </div>
        {candidateDetails.discarded_at &&
          <p className="items-center p-1 m-5 text-xs font-bold leading-4 tracking-widest text-center rounded-xs bg-col-yellow-600 text-miru-alert-green-1000">
            The Candidate is deleted, Kept for future use!!!
          </p>
        }
        {isCandidateOpen && <div className="flex mt-4 ml-12">
          <div className="text-xs text-col-dark-app-400">
            <h6 className="font-semibold">Assignee</h6>
            <p>{candidateDetails.assignee_name ? candidateDetails.assignee_name : "UNASSIGNED"}</p>
          </div>
          <div className="text-xs ml-22 text-col-dark-app-400">
            <h6 className="font-semibold">Reporter</h6>
            <p>{candidateDetails.reporter_name ? candidateDetails.reporter_name : "UNREPORTED"}</p>
          </div>
          <div className="text-xs ml-22 text-col-dark-app-400">
            <h6 className="font-semibold">Status</h6>
            <p>
              <span className={candidateDetails.status_code_name ? `${getStatusCssClass(candidateDetails.status_code_name)} uppercase` : ""}>
                {candidateDetails.status_code_name}
              </span>
            </p>
          </div>
        </div>
        }
      </div>
      {showDeleteDialog && (
        <DeleteCandidate
          setShowDeleteDialog={setShowDeleteDialog}
          candidate={candidateToDelete}
        />
      )}
    </>

  );
};

export default Header;
