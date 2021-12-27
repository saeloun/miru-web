import * as React from "react";

import Container from "../../Container";

const ForgotPasswordPage = () => (
  <Container>
    <h2 className="font-medium text-center text-3xl lg:text-4xl text-mirublack-1000 mb-5">
      Miru
    </h2>
    <div className="p-5 2xl:p-10 shadow-xl rounded-lg">
      <h2 className="text-mirublack-1000 lg:mb-3 text-base font-medium">
        Forgot Password
      </h2>

      <form>
        <div className="field">
          <label htmlFor="email" className="text-xs text-mirublack-1000">
            Email
          </label>
          <br />
          <input
            type="email"
            className="h-8 w-full focus:outline-none bg-mirugrey-200 text-sm"
            id="email"
          />
        </div>

        <div className="actions">
          <button
            type="submit"
            className="mt-5 h-8 w-full bg-mirugrey-400 font-bold text-white text-base hover:bg-miru-1000"
          >
            RESET PASSWORD
          </button>
        </div>
      </form>
      <div className="text-center m-2">
        <p className="text-center text-mirugrey-400 text-xs hover:text-mirublack-1000">
          <a href="/login">Sign In</a>
        </p>
      </div>
    </div>
  </Container>
);

export default ForgotPasswordPage;
