import * as React from "react";

interface SetPasswordProps {
  setPassword: (password: string) => void;
  setPasswordConfirmation: (passwordConfirmation: string) => void;
  handleSubmit: (e) => void;
}

const setPasswordForm = ({
  setPassword,
  setPasswordConfirmation,
  handleSubmit
}: SetPasswordProps) => (
  <form>
    <div className="mt-3">
      <div className="field">
        <label htmlFor="password" className="text-xs text-miru-black-1000">
            Password
        </label>
        <br />
        <input
          type="password"
          className="h-8 w-full focus:outline-none bg-miru-grey-200 text-sm"
          id="password"
          onChange={e => setPassword(e.target.value)}
        />
      </div>

      <div className="field mt-2">
        <label
          htmlFor="password_confirmation"
          className="text-xs text-miru-black-1000"
        >
            Password Confirmation
        </label>
        <br />
        <input
          type="password"
          className="h-8 w-full focus:outline-none bg-miru-grey-200 text-sm"
          id="password_confirmation"
          onChange={e => setPasswordConfirmation(e.target.value)}
        />
      </div>
    </div>

    <div className="actions">
      <button
        className="h-8 mt-6 w-full bg-miru-grey-400 font-bold text-white text-base hover:bg-miru-black-1000"
        onClick={handleSubmit}
      >
          SET PASSWORD
      </button>
    </div>
  </form>
);

export default setPasswordForm;
