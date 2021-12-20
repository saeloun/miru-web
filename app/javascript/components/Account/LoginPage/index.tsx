import * as React from "react";

const Login = () => (
  <div className="pt-10/100 px-10 xsm:px-20/100 sm:px-26/100 md:px-30/100 lg:px-32/100 xl:px-36/100">
    <div className="font-jakartasans">
      <h2 className="font-medium text-center text-3xl lg:text-4xl text-miru-1000 mb-5">
        Miru
      </h2>
      <div className="p-5 2xl:p-10 shadow-xl rounded-lg">
        <h2 className="text-miru-1000 lg:mb-3 text-base font-medium">
          Sign In
        </h2>

        <form>
          <div className="field">
            <label className="text-xs text-miru-1000" htmlFor="email">
              Email
            </label>
            <br />
            <input
              className="h-8 w-full focus:outline-none bg-miru-200 text-sm"
              id="email"
              type="text"
              placeholder="Enter Email"
            />
          </div>

          <div className="mt-3">
            <div className="field">
              <label className="text-xs text-miru-1000" htmlFor="password">
                Password
              </label>
              <br />
              <input
                className="h-8 w-full focus:outline-none bg-miru-200 text-sm"
                id="password"
                type="password"
                placeholder="Enter Password"
              />
            </div>
          </div>

          <div className="actions mt-3">
            <button className="h-8 w-full bg-miru-400 font-bold text-white text-base hover:bg-miru-1000">
              SIGN IN
            </button>
          </div>
        </form>
        <div className="mt-3 text-center">
          <a
            className="text-center text-miru-400 text-xs hover:text-miru-1000"
            href="#"
          >
            Forgot Password?
          </a>
        </div>
        <div className="text-center">
          <p className="text-center text-miru-400 text-xs hover:text-miru-1000">
            Don't have an account? <a href="/signup">Sign Up</a>
          </p>
        </div>
      </div>
    </div>
  </div>
);

export default Login;
