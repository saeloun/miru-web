import * as React from "react";

import Container from "../../Container";

const SetPasswordPage = () => (
  <Container>
    <h2 className="font-medium text-center text-3xl lg:text-4xl text-mirublack-1000 mb-5">
      Miru
    </h2>
    <div className="p-5 2xl:p-10 shadow-xl rounded-lg">
      <h2 className="text-miru-1000 lg:mb-3 text-base font-medium">
        Set Password
      </h2>

      <form>
        <div className="mt-3">
          <div className="field">
            <label htmlFor="password" className="text-xs text-mirublack-1000">
              Password
            </label>
            <br />
            <input
              type="password"
              className="h-8 w-full focus:outline-none bg-mirugrey-200 text-sm"
              id="password"
            />
          </div>

          <div className="field mt-2">
            <label
              htmlFor="password_confirmation"
              className="text-xs text-mirublack-1000"
            >
              Password Confirmation
            </label>
            <br />
            <input
              type="password"
              className="h-8 w-full focus:outline-none bg-mirugrey-200 text-sm"
              id="password_confirmation"
            />
          </div>
        </div>

        <div className="actions">
          <button className="h-8 mt-6 w-full bg-mirugrey-400 font-bold text-white text-base hover:bg-mirublack-1000">
            SET PASSWORD
          </button>
        </div>
      </form>
    </div>
  </Container>
);
export default SetPasswordPage;
