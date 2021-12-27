import * as React from "react";

interface ForgotPasswordFormProps {
  setEmail: (email: string) => void;
  handleSubmit: (e) => void;
}

const ForgotPasswordForm = ({
  setEmail,
  handleSubmit
}: ForgotPasswordFormProps) => (
  <form>
    <div className="field">
      <label htmlFor="email" className="text-xs text-miru-1000">
        Email
      </label>
      <br />
      <input
        type="email"
        className="h-8 w-full focus:outline-none bg-miru-200 text-sm"
        onChange={e => setEmail(e.target.value)}
      />
    </div>

    <div className="actions">
      <button
        type="submit"
        className="mt-5 h-8 w-full bg-miru-400 font-bold text-white text-base hover:bg-miru-1000"
        onClick={handleSubmit}
      >
        RESET PASSWORD
      </button>
    </div>
  </form>
);

export default ForgotPasswordForm;
