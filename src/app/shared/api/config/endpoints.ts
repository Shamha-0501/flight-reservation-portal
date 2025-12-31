export const ApiEndpoints = {
    Auth: {
        Login: "auth/login",
        Register: "auth/register",
        Logout: "auth/logout",
        User: "/auth/me"
    },
    User: {
        Profile: 'user/profile'
    }
};

export type ApiEndpointsType = typeof ApiEndpoints;