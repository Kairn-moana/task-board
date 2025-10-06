import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../api/services/authService.js"; // 使用新的 authService
import "./AuthForm.css";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // 使用新的 authService
      const data = await authService.login(username, password);

      // 保存 token 并跳转
      localStorage.setItem("token", data.token);
      navigate("/");
    } catch (err) {
      setError(err.message || "登录失败，请稍后再试");
      console.error("登录错误:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>登录</h2>
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
        <button type="submit" disabled={isLoading}>
          {isLoading ? "登录中..." : "登录"}
        </button>
        <p>
          还没有账号？ <Link to="/register">立即注册</Link>
        </p>
      </form>
    </div>
  );
}

export default LoginPage;
