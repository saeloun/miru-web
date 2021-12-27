import * as React from "react";

interface SignupFormProps {
  setFirstName: (firstName: string) => void;
  setLastName: (lastName: string) => void;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setPasswordConfirmation: (passwordConfirmation: string) => void;
  handleSubmit: (e) => void;
}

const SignupForm = ({
  setFirstName,
  setLastName,
  setEmail,
  setPassword,
  setPasswordConfirmation,
  handleSubmit
}: SignupFormProps) => (
  <form>
    <div className="field">
      <label htmlFor="first_name" className="text-xs text-miru-1000">
          First Name
      </label>
      <br />
      <input
        type="text"
        className="h-8 w-full focus:outline-none bg-miru-200 text-sm"
        onChange={e => setFirstName(e.target.value)}
      />
    </div>
    <div className="field">
      <label htmlFor="last_name" className="text-xs text-miru-1000">
          Last Name
      </label>
      <br />
      <input
        type="text"
        className="h-8 w-full focus:outline-none bg-miru-200 text-sm"
        onChange={e => setLastName(e.target.value)}
      />
    </div>
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

    <div className="field">
      <label htmlFor="password" className="text-xs text-miru-1000">
          Password
      </label>
      <br />
      <input
        type="password"
        className="h-8 w-full focus:outline-none bg-miru-200 text-sm"
        onChange={e => setPassword(e.target.value)}
      />
    </div>

    <div className="field">
      <label
        htmlFor="password_confirmation"
        className="text-xs text-miru-1000"
      >
          Password Confirmation
      </label>
      <br />
      <input
        type="password"
        className="h-8 w-full focus:outline-none bg-miru-200 text-sm"
        onChange={e => setPasswordConfirmation(e.target.value)}
      />
    </div>

    <div className="actions">
      <button
        type="submit"
        className="mt-5 h-8 w-full bg-miru-400 font-bold text-white text-base hover:bg-miru-1000"
        onClick={handleSubmit}
      >
          Sign up
      </button>
    </div>

    <p className="m-3 text-xs text-miru-1000 text-center"> OR </p>

    <div>
      <button className=" h-8 w-full bg-miru-400 font-bold text-white text-base hover:bg-miru-1000">
          SIGN UP WITH GOOGLE
      </button>
    </div>
    <div>
      <button className="mt-5 h-8 w-full bg-miru-400 font-bold text-white text-base hover:bg-miru-1000">
          SIGN UP WITH APPLE
      </button>
    </div>
  </form>
);

export default SignupForm;
