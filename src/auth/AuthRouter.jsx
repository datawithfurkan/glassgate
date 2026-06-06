import { useEffect, useState } from "react";
import { isAuthenticated } from "./auth.js";
import { LoginPage } from "./LoginPage.jsx";
import { SignUpPage } from "./SignUpPage.jsx";
import { ResetPasswordPage } from "./ResetPasswordPage.jsx";
import { goToAppPage, parseAuthRoute } from "../app/navigation.js";

const pages = {
  login: LoginPage,
  signup: SignUpPage,
  reset: ResetPasswordPage,
};

export function AuthRouter() {
  const [page, setPage] = useState(() => parseAuthRoute());

  useEffect(() => {
    const update = () => setPage(parseAuthRoute());
    window.addEventListener("popstate", update);
    window.addEventListener("routechange", update);
    return () => {
      window.removeEventListener("popstate", update);
      window.removeEventListener("routechange", update);
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated() && page === "login") goToAppPage("overview");
  }, [page]);

  const Page = pages[page] || LoginPage;
  return <Page />;
}

export function isAuthRoute(pathname = window.location.pathname) {
  return parseAuthRoute(pathname) !== null;
}
