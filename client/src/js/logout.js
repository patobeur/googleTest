// client/src/js/logout.js

export function logout(gameSocket) {
    const token = localStorage.getItem("token");
    if (token) {
        localStorage.removeItem("token");
    }

    if (gameSocket && gameSocket.connected) {
        gameSocket.disconnect();
    }

    // Reload the page to go back to the login screen
    window.location.reload();
}
