import { AuthService } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const guestLinks = document.getElementById('guest-links');
    const userLinks = document.getElementById('user-links');
    const logoutButton = document.getElementById('logout-button');

    if (token) {
        guestLinks.style.display = 'none';
        userLinks.style.display = 'block';
    } else {
        guestLinks.style.display = 'block';
        userLinks.style.display = 'none';
    }

    if(logoutButton) {
        logoutButton.addEventListener('click', () => {
            AuthService.logout();
            window.location.href = '/';
        });
    }
});
