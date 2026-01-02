import { useState } from "react";
import "./styles/main.css";
import logo from "./assets/logofixx.png";

export default function Login({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true); // Toggle antara login dan register
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Simulasi authentication (dalam praktik nyata, hubungkan ke backend API)
  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validasi input
      if (!username.trim() || !password.trim()) {
        setError("Username dan password tidak boleh kosong!");
        setLoading(false);
        return;
      }

      if (username.length < 3) {
        setError("Username minimal 3 karakter!");
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setError("Password minimal 6 karakter!");
        setLoading(false);
        return;
      }

      // Jika register, validasi password match
      if (!isLogin && password !== confirmPassword) {
        setError("Password tidak sesuai!");
        setLoading(false);
        return;
      }

      // Simulasi API call (replace dengan actual API call ke backend)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get existing users dari localStorage
      const users = JSON.parse(localStorage.getItem("tutor_users") || "{}");

      if (isLogin) {
        // LOGIN: Validasi user ada dan password match
        if (!users[username]) {
          setError("Username tidak ditemukan. Silakan daftar terlebih dahulu.");
          setLoading(false);
          return;
        }

        if (users[username].password !== password) {
          setError("Password salah!");
          setLoading(false);
          return;
        }

        // Login berhasil
        const userId = users[username].userId;
        localStorage.setItem("tutor_currentUser", JSON.stringify({
          userId,
          username,
          loginTime: new Date().toISOString()
        }));

        onLoginSuccess({ userId, username });
      } else {
        // REGISTER: Cek apakah username sudah ada
        if (users[username]) {
          setError("Username sudah terdaftar. Gunakan username lain.");
          setLoading(false);
          return;
        }

        // Buat user baru dengan ID unik
        const userId = "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
        users[username] = {
          userId,
          username,
          password, // Dalam praktik nyata, hash password ini!
          registeredAt: new Date().toISOString()
        };

        localStorage.setItem("tutor_users", JSON.stringify(users));

        // Setelah register, otomatis login
        localStorage.setItem("tutor_currentUser", JSON.stringify({
          userId,
          username,
          loginTime: new Date().toISOString()
        }));

        onLoginSuccess({ userId, username });
      }
    } catch (err) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      console.error("Auth error:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setUsername("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="login-container">
      <div className="login-card fade-in-up">
        <div className="login-header">
          <img src={logo} alt="Logo" className="login-logo" />
          <h1>{isLogin ? "Masuk Akun" : "Daftar Akun"}</h1>
          <p>{isLogin ? "Selamat datang kembali!" : "Buat akun baru untuk memulai"}</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleAuth} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              className="login-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              disabled={loading}
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Konfirmasi Password</label>
              <input
                id="confirmPassword"
                type="password"
                className="login-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password"
                disabled={loading}
              />
            </div>
          )}

          <button 
            type="submit" 
            className="login-btn"
            disabled={loading}
          >
            {loading ? "Mohon tunggu..." : (isLogin ? "Masuk" : "Daftar")}
          </button>
        </form>

        <div className="login-footer">
          <p>
            {isLogin ? "Belum punya akun? " : "Sudah punya akun? "}
            <button 
              type="button" 
              className="toggle-btn"
              onClick={toggleMode}
              disabled={loading}
            >
              {isLogin ? "Daftar di sini" : "Masuk di sini"}
            </button>
          </p>
        </div>

        <div className="login-info">
          <small>💡 Tips: Gunakan username dan password yang mudah diingat</small>
        </div>
      </div>
    </div>
  );
}
