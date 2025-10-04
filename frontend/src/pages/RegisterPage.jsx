import { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // 导入用于跳转和链接的 Hooks
import { registerUser } from "../api"; // 我们将在 api 文件中创建这个函数
import "./AuthForm.css";

function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // 获取 navigate 函数，用于编程式跳转

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null); // 重置错误信息

    try {
      const response = await registerUser(username, password);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || "注册失败");
      }
      const data = await response.json();

      // 注册成功！保存 token
      localStorage.setItem("token", data.token);

      navigate("/");
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
