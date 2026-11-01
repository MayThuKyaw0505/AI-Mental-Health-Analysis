import { useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Icon from "./Icon";

const navigation = [
  { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/journals", label: "Journals & AI analysis", icon: "journal" },
  { to: "/assessments", label: "Assessments", icon: "assessment" },
  { to: "/assessment-history", label: "Assessment history", icon: "history" },
  { to: "/profile", label: "Profile & privacy", icon: "profile" },
];

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const currentPage =
    navigation.find((item) => item.to === pathname)?.label ?? "Your space";

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-layout">
      <a className="skip-link" href="#page-content">
        Skip to content
      </a>
      <aside className="sidebar">
        <div className="sidebar-top">
          <Link
            className="brand"
            to="/dashboard"
            onClick={() => setMenuOpen(false)}
          >
            <span className="brand-mark">
              <Icon name="leaf" />
            </span>
            <span>
              Stillwell<small>A space for reflection</small>
            </span>
          </Link>
          <button
            className="button secondary menu-toggle"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="main-navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Icon name="menu" />
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>
        <div
          className={`navigation-area ${menuOpen ? "is-open" : ""}`}
          id="main-navigation"
        >
          <p className="nav-caption">YOUR WELL-BEING SPACE</p>
          <nav aria-label="Main navigation">
            {navigation.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <Icon name={icon} />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="sidebar-note">
              <Icon name="leaf" />
              <p>
                A little reflection.
                <br />
                At your own pace.
              </p>
            </div>
            <button
              className="nav-link logout-button"
              type="button"
              onClick={logout}
            >
              <Icon name="logout" />
              Log out
            </button>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="workspace-header">
          <span>{currentPage}</span>
          <span className="workspace-label">
            <span className="status-dot" />
            Your personal space
          </span>
        </header>
        <div
          className="page-container"
          id="page-content"
          tabIndex={-1}
          key={pathname}
        >
          <Outlet />
        </div>
        <footer className="app-footer">
          <Icon name="shield" />
          <p>
            For self-reflection and screening. This application does not provide
            medical diagnosis or treatment.
          </p>
          <span>University project · Local prototype</span>
        </footer>
      </div>
    </div>
  );
}
