import { AuthService } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");
    const forgotPasswordForm = document.getElementById("forgot-password-form");
    const resetPasswordForm = document.getElementById("reset-password-form");

    const showRegister = document.getElementById("show-register");
    const showLoginFromRegister = document.getElementById("show-login-from-register");
    const showForgotPassword = document.getElementById("show-forgot-password");
    const showLoginFromForgot = document.getElementById("show-login-from-forgot");

    const loginButton = document.getElementById("login-button");
    const registerButton = document.getElementById("register-button");
    const forgotButton = document.getElementById("forgot-button");
    const resetButton = document.getElementById("reset-button");

    function showForm(formToShow) {
        loginForm.style.display = "none";
        registerForm.style.display = "none";
        forgotPasswordForm.style.display = "none";
        resetPasswordForm.style.display = "none";
        formToShow.style.display = "block";
    }

    showRegister.addEventListener("click", (e) => {
        e.preventDefault();
        showForm(registerForm);
    });

    showLoginFromRegister.addEventListener("click", (e) => {
        e.preventDefault();
        showForm(loginForm);
    });

    showForgotPassword.addEventListener("click", (e) => {
        e.preventDefault();
        showForm(forgotPasswordForm);
    });

    showLoginFromForgot.addEventListener("click", (e) => {
        e.preventDefault();
        showForm(loginForm);
    });

    registerButton.addEventListener("click", async () => {
        const name = document.getElementById("register-name").value;
        const email = document.getElementById("register-email").value;
        const password = document.getElementById("register-password").value;
        const success = await AuthService.register(name, email, password);
        if (success) {
            alert("Registration successful! Please login.");
            showForm(loginForm);
        } else {
            alert("Registration failed. Please try again.");
        }
    });

    loginButton.addEventListener("click", async () => {
        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;
        const success = await AuthService.login(email, password);
        if (success) {
            window.location.href = '/character-selection';
        } else {
            alert("Login failed. Please check your credentials.");
        }
    });

    forgotButton.addEventListener("click", async () => {
        const email = document.getElementById("forgot-email").value;
        const success = await AuthService.forgotPassword(email);
        if (success) {
            alert("Password reset token sent to your email.");
            showForm(resetPasswordForm);
        } else {
            alert("Failed to send reset token. Please check the email address.");
        }
    });

    resetButton.addEventListener("click", async () => {
        const token = document.getElementById("reset-token").value;
        const password = document.getElementById("reset-password").value;
        const success = await AuthService.resetPassword(token, password);
        if (success) {
            alert("Password has been reset successfully. Please login.");
            showForm(loginForm);
        } else {
            alert("Failed to reset password. The token may be invalid or expired.");
        }
    });

    // Show the login form by default
    showForm(loginForm);
});
