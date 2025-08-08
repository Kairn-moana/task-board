import { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // 导入用于跳转和链接的 Hooks
import { loginUser } from "../api"; // 我们将在 api 文件中创建这个函数
import "./AuthForm.css";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // 获取 navigate 函数，用于编程式跳转

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null); // 重置错误信息

    try {
      const response = await loginUser(username, password);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || "登录失败");
      }
      const data = await response.json();

      // 登录成功！保存 token
      localStorage.setItem("token", data.token);

      // 跳转到主看板页面
      navigate("/"); // 跳转到根路径
    } catch (err) {
      setError(err.message);
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
        <button type="submit">登录</button>
        <p>
          还没有账号？ <Link to="/register">立即注册</Link>
        </p>
      </form>
    </div>
  );
}

export default LoginPage;
