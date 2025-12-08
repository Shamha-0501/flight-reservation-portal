import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  checkAuthStatus,
  clearCredentials,
  logoutUser,
} from "../../redux/slices/authSlice";

export const useAuth = (debug: boolean = false) => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, isLoading, error, isInitialized } =
    useSelector((state: any) => state.auth);

  const initAttempted = useRef(false);

  useEffect(() => {
    if (!isInitialized && !initAttempted.current) {
      initAttempted.current = true;
      dispatch(checkAuthStatus() as any);
    }
  }, [dispatch, isInitialized, debug]);

  useEffect(() => {
    if (debug) {
      console.log("[useAuth] State:", {
        user,
        isAuthenticated,
        isLoading,
        isInitialized,
        error,
      });
    }
  }, [user, isAuthenticated, isLoading, isInitialized, error, debug]);

  const logout = useCallback(() => {
    if (debug) console.log("[useAuth] Logout called");
    dispatch(logoutUser() as any);
  }, [dispatch, debug]);

  const forceLogout = useCallback(() => {
    if (debug) console.log("[useAuth] Force logout called");
    dispatch(clearCredentials());
  }, [dispatch, debug]);

  const getUserRole = useCallback(() => {
    const role = user?.role || null;
    if (debug) console.log("[useAuth] Get role:", role);
    return role;
  }, [user, debug]);

  const refreshAuth = useCallback(() => {
    if (debug) console.log("[useAuth] Refresh auth called");
    dispatch(checkAuthStatus() as any);
  }, [dispatch, debug]);

  return {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    error,
    logout,
    forceLogout,
    getUserRole,
    refreshAuth,
  };
};
