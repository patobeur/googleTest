// client/src/js/auth.js

async function register(name, email, password) {
    try {
        const response = await fetch("/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, name }),
        });
        return response.ok;
    } catch (error) {
        console.error("Registration error:", error);
        return false;
    }
}

async function login(email, password) {
    try {
        const response = await fetch("/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        if (response.ok) {
            const { token } = await response.json();
            localStorage.setItem("token", token);
            return true;
        }
        return false;
    } catch (error) {
        console.error("Login error:", error);
        return false;
    }
}

async function forgotPassword(email) {
    try {
        const response = await fetch("/auth/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });
        return response.ok;
    } catch (error) {
        console.error("Forgot password error:", error);
        return false;
    }
}

async function resetPassword(token, password) {
    try {
        const response = await fetch("/auth/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, password }),
        });
        return response.ok;
    } catch (error) {
        console.error("Reset password error:", error);
        return false;
    }
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("selectedCharacter");
}

export const AuthService = {
    register,
    login,
    forgotPassword,
    resetPassword,
    logout,
};
