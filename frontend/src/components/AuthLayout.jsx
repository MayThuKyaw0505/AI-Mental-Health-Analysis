import { Link } from "react-router-dom";
import Icon from "./Icon";

export default function AuthLayout({ title, description, children }) {
  return (
    <main className="auth-layout">
      <section className="auth-story" aria-label="Welcome to Stillwell">
        <Link className="brand" to="/login">
          <span className="brand-mark">
            <Icon name="leaf" />
          </span>
          <span>
            Stillwell<small>A space for reflection</small>
          </span>
        </Link>
        <div className="auth-story-body">
          <span className="eyebrow">A MOMENT FOR YOURSELF</span>
          <h2>
            Make room for
            <br />
            how you feel.
          </h2>
          <p>
            A thoughtful space to reflect on your day, notice patterns, and
            understand your well-being over time.
          </p>
          <div className="auth-features">
            <span>
              <Icon name="journal" />
              Personal journaling
            </span>
            <span>
              <Icon name="spark" />
              AI-assisted reflection
            </span>
            <span>
              <Icon name="history" />
              Well-being check-ins
            </span>
          </div>
        </div>
        <p className="auth-disclaimer">
          A university project for self-reflection and screening.
          <br />
          Not a substitute for professional care.
        </p>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <p className="eyebrow">YOUR WELL-BEING SPACE</p>
          <h1>{title}</h1>
          <p className="page-description">{description}</p>
          {children}
        </div>
        <p className="auth-bottom">Take it one day at a time.</p>
      </section>
    </main>
  );
}
