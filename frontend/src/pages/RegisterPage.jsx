import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../api/services/authService.js"; // 使用新的 authService
import "./AuthForm.css";

function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    try {
      // 使用新的 authService
      const data = await authService.register(username, password);

      console.log("注册成功，token=", data.token);

      // 如果有 token，保存并跳转
      if (data.token) {
        localStorage.setItem("token", data.token);
        navigate("/");
      } else {
        // 注册成功但没有自动登录，跳转到登录页面
        navigate("/login");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>注册</h2>
        {error && <p className="error-message">{error}</p>}
        <div className="form-group">
          <label htmlFor="username">用户名</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">密码</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">注册</button>
        <p>
          已有账号？ <Link to="/login">立即登录</Link>
        </p>
      </form>
    </div>
  );
}

export default RegisterPage;
