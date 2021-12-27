import * as React from "react";

interface LoginFormProps {
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  handleSubmit: (e) => void;
}

const LoginForm = ({ setEmail, setPassword, handleSubmit }: LoginFormProps) => (
  <form>
    <div className="field">
      <label className="text-xs text-miru-black-1000" htmlFor="email">
        Email
      </label>
      <br />
      <input
        className="h-8 w-full focus:outline-none bg-miru-grey-200 text-sm"
        type="text"
        placeholder="Enter Email"
        onChange={e => setEmail(e.target.value)}
      />
    </div>

    <div className="mt-3">
      <div className="field">
        <label className="text-xs text-miru-black-1000" htmlFor="password">
          Password
        </label>
        <br />
        <input
          className="h-8 w-full focus:outline-none bg-miru-grey-200 text-sm"
          type="password"
          placeholder="Enter Password"
          onChange={e => setPassword(e.target.value)}
        />
      </div>
    </div>

    <div className="actions mt-3">
      <button
        className="h-8 w-full bg-miru-grey-400 font-bold text-white text-base hover:bg-miru-black-1000"
        onClick={handleSubmit}
      >
        SIGN IN
      </button>
    </div>
  </form>
);

export default LoginForm;
