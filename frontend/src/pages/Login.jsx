import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import api from "../api/axios";
import AuthLayout from "../components/AuthLayout";
import PasswordField from "../components/PasswordField";
import { Notice } from "../components/UI";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { data } = await api.post("auth/login/", { username, password });
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      navigate("/dashboard");
    } catch (err) {
      setError(
        !err.response
          ? "Unable to connect. Check that the backend is running and try again."
          : err.response.status >= 500
            ? "The server couldn't sign you in. Please try again."
            : "Your username or password is incorrect. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to continue your personal reflections."
    >
      <Notice type="success">{location.state?.message}</Notice>
      <form onSubmit={handleSubmit} aria-busy={submitting}>
        <fieldset disabled={submitting}>
          <div className="form-field">
            <label htmlFor="login-username">Username</label>
            <input
              id="login-username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              aria-describedby={error ? "login-error" : undefined}
            />
          </div>
          <PasswordField
            id="login-password"
            label="Password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            aria-describedby={error ? "login-error" : undefined}
          />
          <button className="button full-width" type="submit">
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </fieldset>
        <Notice type="error" id="login-error">
          {error}
        </Notice>
      </form>
      <p className="auth-switch">
        New here? <Link to="/register">Create an account</Link>
      </p>
    </AuthLayout>
  );
}

export default Login;
