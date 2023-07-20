export const loginGoogleAuth = (token, email, authDispatch, navigate) => {
  try {
    //// @ts-expect-error for authDispatch initial values
    authDispatch({
      type: "LOGIN",
      payload: {
        token,
        email,
      },
    });

    setTimeout(() => (window.location.href = `${window.location.origin}`), 500);
  } catch (error) {
    if (error.response.data.unconfirmed) {
      navigate(`/`);
    }
  }
};
