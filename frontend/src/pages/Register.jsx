import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import AuthLayout from "../components/AuthLayout";
import PasswordField from "../components/PasswordField";
import { Notice } from "../components/UI";
import { apiError } from "../utils/format";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post("auth/register/", { username, email, password });
      navigate("/login", {
        state: {
          message: "Account created successfully. You can now sign in.",
        },
      });
    } catch (err) {
      setError(
        apiError(err, "Registration failed. Please check your details."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Your space starts here"
      description="Create an account to begin your reflection journey."
    >
      <form onSubmit={handleSubmit} aria-busy={submitting}>
        <fieldset disabled={submitting}>
          <div className="form-field">
            <label htmlFor="register-username">Username</label>
            <input
              id="register-username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              maxLength={150}
              required
              aria-describedby="username-help"
            />
            <p id="username-help" className="form-help">
              Letters, numbers, and @ . + - _ only.
            </p>
          </div>
          <div className="form-field">
            <label htmlFor="register-email">
              Email address <span className="muted">(optional)</span>
            </label>
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              maxLength={254}
            />
          </div>
          <PasswordField
            id="register-password"
            label="Password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
            aria-describedby="register-password-help"
          />
          <p id="register-password-help" className="form-help">
            Use at least 8 characters and choose a password you don't use
            elsewhere.
          </p>
          <button className="button full-width register-submit" type="submit">
            {submitting ? "Creating your account…" : "Create account"}
          </button>
        </fieldset>
        <Notice type="error">{error}</Notice>
      </form>
      <p className="auth-switch">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  );
}

export default Register;
