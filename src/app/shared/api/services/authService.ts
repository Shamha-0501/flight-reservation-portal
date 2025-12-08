import ApiClient, {
  getAuthState,
  updateAuthState,
  initializeXSRFToken,
} from "../config/axios";
import { ApiEndpoints } from "../config/endpoints";

/**
 * Error normalization sanctum (Forge/Sanctum friendly)
 */
const handleError = (error: any) => {
  let message = "An error occured";
  let validationErrors = null;

  if (error?.response?.data) {
    const { message: errMsg, errors } = error.response.data;

    if (errMsg) {
      message = errMsg;
    }

    if (error) {
      if (typeof errors === "object" && !Array.isArray(errors)) {
        validationErrors = errors;
        const errorMessages = Object.values(errors)
          .flat()
          .filter(Boolean)
          .join(", ");
        if (errorMessages && !errMsg) {
          message = errorMessages;
        }
      } else if (typeof errors === "string") {
        message = errors;
      }
    } else if (errors?.message) {
      message = error.message;
    }
  }

  const e: any = new Error(message);
  e.status = error?.response?.status ?? 0;
  e.validationErrors = validationErrors;
  e.raw = error;
  return e;
};

/**
 * CSRF bootstrap before any auth action
 */
const ensureCSRFToken = async () => {
  try {
    await initializeXSRFToken();
  } catch (err) {
    console.warn("CSRF token initialization failed:", err);
  }
};

/**
 * Auth API
 */

// Login (Sanctum: session coookie set by backend)
export const login = async (credentials: any) => {
  try {
    await ensureCSRFToken();

    const res = await ApiClient.post(ApiEndpoints.Auth.Login, credentials);

    if (res?.data?.user) {
      updateAuthState(true, res.data.user);
    } else {
      updateAuthState(true, null);
    }

    return res.data;
  } catch (err) {
    throw handleError(err);
  }
};

// Register
export const register = async (payload: any) => {
  try {
    await ensureCSRFToken();

    const res = await ApiClient.post(ApiEndpoints.Auth.Register, payload);

    if (res?.data?.user) {
      updateAuthState(true, res.data.user);
    } else {
      updateAuthState(true, null);
    }

    return res.data;
  } catch (err) {
    throw handleError(err);
  }
};

// Logout
export const logout = async () => {
  try {
    await ensureCSRFToken();

    await ApiClient.post(ApiEndpoints.Auth.Logout);
  } catch (err) {
    console.warn("Logout API call failed:", err);
  } finally {
    updateAuthState(false, null);
  }
};

// Check any user logged in
export const checkAuthStatus = async () => {
  try {
    const res = await ApiClient.get(ApiEndpoints.Auth.User);

    // Backend shape: { user: { ... } } or { user: null }
    const user = res?.data?.user ?? null;

    if (user) {
      // keep in-memory auth state in sync
      updateAuthState(true, user);

      // what the Redux thunk expects
      return {
        isAuthenticated: true,
        user,
      };
    }

    // no user in response -> treat as logged out
    updateAuthState(false, null);
    return { isAuthenticated: false, user: null };
  } catch (err: any) {
    const status = err?.response?.status;

    // Unauthorized / CSRF expired -> logged out
    if (status === 401 || status === 419) {
      updateAuthState(false, null);
      return { isAuthenticated: false, user: null };
    }

    console.error("Auth status check failed unexpectedly:", err);

    // Network error -> keep whatever we currently know in memory
    if (!err?.response) {
      console.warn(
        "Network error during auth check - maintaining current state"
      );
      const currentState = getAuthState();
      return {
        isAuthenticated: currentState.isAuthenticated,
        user: currentState.user,
      };
    }

    // Fallback: treat as logged out
    updateAuthState(false, null);
    return { isAuthenticated: false, user: null };
  }
};
export const initializeAuth = async () => {
  try {
    await ensureCSRFToken();
    await checkAuthStatus();
  } catch (err) {
    console.error("Failed to initialize auth state:", err);
    updateAuthState(false, null);
  }
};

// Memory-backed getters (for components needing quick access)
export const getCurrentUser = () => getAuthState().user as any;
export const isAuthenticated = () => !!getAuthState().isAuthenticated;
export const getUserRole = () => getCurrentUser()?.role ?? null;
