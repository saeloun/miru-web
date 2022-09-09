import React from "react";
import { useNavigate } from "react-router-dom";
import candidates from "apis/candidates";

interface IProps {
  candidate: any;
  setShowDeleteDialog: any;
  basePath: any;
}

const DeleteCandidate = ({ candidate, setShowDeleteDialog, basePath }: IProps) => {

  const navigate = useNavigate();

  const deleteCandidate = async (candidate: any) => {
    await candidates.destroy(candidate.id);
    setTimeout(() => {
      navigate(basePath)
    }, 500);
  };
  return (
    <div className="flex items-center justify-center px-4">
      <div
        className="fixed inset-0 top-0 bottom-0 left-0 right-0 z-10 flex items-start justify-center overflow-auto"
        style={{
          backgroundColor: "rgba(29, 26, 49, 0.6)"
        }}
      >
        <div className="relative w-full h-full px-4 md:flex md:items-center md:justify-center">
          <div className="px-6 pb-6 transition-all transform bg-white rounded-lg shadow-xl sm:align-middle sm:max-w-md modal-width">
            <div className="flex-col my-8">
              <h6 className="mb-2 text-2xl font-bold">Delete Candidate</h6>
              <p className="mt-2 font-normal">
                Are you sure you want to delete candidate{" "}
                <b className="font-bold">{candidate.name}</b>? This action cannot
                be reversed.
              </p>
            </div>
            <div className="flex justify-between">
              <button
                className="button__bg_transparent"
                onClick={() => {
                  setShowDeleteDialog(false);
                }}
              >
                CANCEL
              </button>
              <button
                className="button__bg_purple"
                onClick={() => {
                  deleteCandidate(candidate);
                }}
              >
                DELETE
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteCandidate;
