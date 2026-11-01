import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Icon from "../components/Icon";
import { EmptyState, Loading, Notice, PageHeader } from "../components/UI";
import { assessmentType, formatDate } from "../utils/format";

function Dashboard() {
  const [journals, setJournals] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const loadDashboard = async () => {
      try {
        const [journalResponse, assessmentResponse] = await Promise.all([
          api.get("journals/", { signal: controller.signal }),
          api.get("assessments/history/", { signal: controller.signal }),
        ]);
        setJournals(journalResponse.data);
        setAssessments(assessmentResponse.data);
      } catch {
        if (!controller.signal.aborted)
          setError(
            "Unable to load dashboard data. Please reload the page to try again.",
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    loadDashboard();
    return () => controller.abort();
  }, []);

  const latestAssessment = (type) =>
    [...assessments]
      .filter((item) => assessmentType(item) === type)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
  const latestPHQ = latestAssessment("PHQ-9");
  const latestGAD = latestAssessment("GAD-7");
  const recentJournals = [...journals]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 3);
  const stats = [
    {
      label: "Journal entries",
      value: journals.length,
      caption: "Thoughts you've made space for",
      icon: "journal",
    },
    {
      label: "Assessments",
      value: assessments.length,
      caption: "Check-ins completed",
      icon: "assessment",
    },
    {
      label: "Latest PHQ-9",
      value: latestPHQ?.total_score ?? "Not taken",
      max: latestPHQ ? 27 : null,
      caption: latestPHQ
        ? `Recorded ${formatDate(latestPHQ.created_at)}`
        : "Your first check-in awaits",
      icon: "history",
    },
    {
      label: "Latest GAD-7",
      value: latestGAD?.total_score ?? "Not taken",
      max: latestGAD ? 21 : null,
      caption: latestGAD
        ? `Recorded ${formatDate(latestGAD.created_at)}`
        : "Go at your own pace",
      icon: "history",
    },
  ];
  const quickLinks = [
    {
      to: "/journals",
      icon: "journal",
      title: "My journal",
      text: "Write, reflect, and revisit",
    },
    {
      to: "/journals",
      icon: "spark",
      title: "AI journal analysis",
      text: "Explore sentiment and emotion",
    },
    {
      to: "/assessments",
      icon: "assessment",
      title: "Take an assessment",
      text: "PHQ-9 and GAD-7 check-ins",
    },
    {
      to: "/assessment-history",
      icon: "history",
      title: "Assessment history",
      text: "See your results over time",
    },
  ];

  return (
    <main>
      <PageHeader
        eyebrow="YOUR OVERVIEW"
        title="Welcome to your space"
        description="A little time to reflect. A clearer view of how you've been feeling."
      />
      <section className="welcome-card" aria-labelledby="welcome-title">
        <div>
          <p className="eyebrow">PAUSE. REFLECT. BEGIN AGAIN.</p>
          <h2 id="welcome-title">How are you feeling today?</h2>
          <p>
            There's no right way to start. Write down a thought, reflect on your
            day, or take a moment to check in.
          </p>
          <Link className="button" to="/journals">
            <Icon name="journal" />
            Write a journal entry
            <Icon name="arrow" />
          </Link>
        </div>
        <div className="welcome-decoration" aria-hidden="true">
          <Icon name="leaf" />
        </div>
      </section>
      {loading && <Loading>Loading your overview…</Loading>}
      <Notice type="error">{error}</Notice>
      {!loading && !error && (
        <>
          <section
            aria-label="Your activity at a glance"
            className="stats-grid"
          >
            {stats.map((stat) => (
              <article className="card stat-card" key={stat.label}>
                <div className="stat-top">
                  <span>{stat.label}</span>
                  <Icon name={stat.icon} />
                </div>
                <p className="stat-value">
                  {stat.value}
                  {stat.max && <small> / {stat.max}</small>}
                </p>
                <p className="stat-caption">{stat.caption}</p>
              </article>
            ))}
          </section>
          <div className="dashboard-columns">
            <section className="card" aria-labelledby="recent-heading">
              <div className="section-heading">
                <h2 id="recent-heading">Recent reflections</h2>
                <Link to="/journals">View all entries</Link>
              </div>
              {recentJournals.length === 0 ? (
                <EmptyState
                  title="Your story starts here"
                  to="/journals"
                  action="Write your first entry"
                  icon="journal"
                >
                  A few words about your day can be a good place to begin.
                </EmptyState>
              ) : (
                recentJournals.map((journal) => (
                  <article className="recent-entry" key={journal.id}>
                    <span className="entry-icon">
                      <Icon name="journal" />
                    </span>
                    <div>
                      <h3>{journal.title || "Untitled journal"}</h3>
                      <p>
                        <time dateTime={journal.created_at}>
                          {formatDate(journal.created_at)}
                        </time>
                      </p>
                    </div>
                    <Link
                      to="/journals"
                      aria-label={`View ${journal.title || "untitled journal"}`}
                    >
                      <Icon name="arrow" />
                    </Link>
                  </article>
                ))
              )}
              {recentJournals.length > 0 && (
                <p className="form-help">
                  Your journal text stays on the Journals page.
                </p>
              )}
            </section>
            <section className="card" aria-labelledby="quick-heading">
              <h2 id="quick-heading">A next step, at your pace</h2>
              {quickLinks.map((item) => (
                <Link className="quick-link" to={item.to} key={item.title}>
                  <Icon name={item.icon} />
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.text}</small>
                  </span>
                  <Icon name="arrow" />
                </Link>
              ))}
            </section>
          </div>
        </>
      )}
    </main>
  );
}

export default Dashboard;
