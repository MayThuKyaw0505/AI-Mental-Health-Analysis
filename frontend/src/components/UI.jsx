import { Link } from "react-router-dom";
import Icon from "./Icon";

export function PageHeader({ eyebrow, title, description, children }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {children && <div className="page-header-actions">{children}</div>}
    </header>
  );
}

export function Notice({ children, type = "info", id }) {
  if (!children) return null;
  return (
    <div
      id={id}
      className={`notice notice-${type}`}
      role={type === "error" ? "alert" : "status"}
    >
      {children}
    </div>
  );
}

export function Loading({ children = "Loading your data…" }) {
  return (
    <div className="loading-state" role="status">
      <span className="loading-dot" />
      {children}
    </div>
  );
}

export function EmptyState({ title, children, to, action, icon = "leaf" }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon name={icon} />
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
      {to && (
        <Link className="button secondary" to={to}>
          {action}
          <Icon name="arrow" />
        </Link>
      )}
    </div>
  );
}
