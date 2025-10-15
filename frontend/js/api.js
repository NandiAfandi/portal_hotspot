export const API_BASE = "http://192.168.50.248:3000"; // ganti ke URL backend kamu

// ambil token dari localStorage
function getToken() {
  return localStorage.getItem("token");
}

// simpan token setelah login
function saveToken(token) {
  localStorage.setItem("token", token);
}

// hapus token saat logout
function clearToken() {
  localStorage.removeItem("token");
}

// helper untuk request ke backend
async function apiRequest(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };

  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (response.status === 403 || response.status === 401) {
    alert("Sesi login sudah tidak valid. Silakan login ulang.");
    clearToken();
    window.location.href = "index.html";
    return;
  }

  return response.json();
}
