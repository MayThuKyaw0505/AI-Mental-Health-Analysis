import { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import ConfirmDialog from "../components/ConfirmDialog";
import Icon from "../components/Icon";
import { EmptyState, Loading, Notice, PageHeader } from "../components/UI";
import { formatDate } from "../utils/format";

async function fetchJournalData(signal) {
  const [journalResponse, analysisResponse] = await Promise.all([
    api.get("journals/", { signal }),
    api.get("analysis/history/", { signal }),
  ]);
  const results = {};
  analysisResponse.data.forEach((analysis) => {
    results[analysis.journal_entry] = analysis;
  });
  return { journals: journalResponse.data, results };
}

function Journals() {
  const [journals, setJournals] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [analysisResults, setAnalysisResults] = useState({});
  const [analyzingId, setAnalyzingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [success, setSuccess] = useState("");
  const contentInput = useRef(null);

  const loadJournals = async () => {
    try {
      const data = await fetchJournalData();
      setJournals(data.journals);
      setAnalysisResults(data.results);
    } catch {
      setError(
        "Unable to load journals or analysis results. Please reload to try again.",
      );
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchJournalData(controller.signal)
      .then((data) => {
        setJournals(data.journals);
        setAnalysisResults(data.results);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError(
            "Unable to load journals or analysis results. Please reload to try again.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!content.trim()) {
      setError("Please write something in your journal.");
      return;
    }

    setSuccess("");
    setSaving(true);
    setError("");

    try {
      const data = {
        title: title.trim(),
        content: content.trim(),
      };

      if (editingId !== null) {
        await api.patch(`journals/${editingId}/`, data);
      } else {
        await api.post("journals/", data);
      }

      if (editingId !== null) {
        setAnalysisResults((previous) => {
          const updated = { ...previous };
          delete updated[editingId];
          return updated;
        });
      }

      resetForm();
      setSuccess(
        editingId !== null
          ? "Journal updated. Analyze again to refresh its AI results."
          : "Your journal entry has been saved.",
      );
      await loadJournals();
    } catch {
      setError("Unable to save journal.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (journal) => {
    setEditingId(journal.id);
    setTitle(journal.title);
    setContent(journal.content);
    setError("");
    setSuccess("");
    contentInput.current?.focus({ preventScroll: true });
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  };

  const handleDelete = async () => {
    const id = deleteId;
    if (id === null) return;
    setDeleting(true);
    setSuccess("");
    try {
      setError("");
      await api.delete(`journals/${id}/`);

      setAnalysisResults((previous) => {
        const updated = { ...previous };
        delete updated[id];
        return updated;
      });

      if (editingId === id) {
        resetForm();
      }

      await loadJournals();
      setSuccess("Journal entry and any saved analysis deleted.");
    } catch {
      setError("Unable to delete journal.");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const handleAnalyze = async (journalId) => {
    setSuccess("");
    setAnalyzingId(journalId);
    setError("");

    try {
      const response = await api.post(
        `analysis/journals/${journalId}/analyze/`,
      );

      setAnalysisResults((previous) => ({
        ...previous,
        [journalId]: response.data,
      }));
    } catch {
      setError("Unable to analyze this journal entry.");
    } finally {
      setAnalyzingId(null);
    }
  };

  const busy = saving || deleting || analyzingId !== null;
  const confidence = (value) =>
    typeof value === "number" && Number.isFinite(value)
      ? `${(value * 100).toFixed(1)}% confidence`
      : "Confidence not available";

  return (
    <main>
      <PageHeader
        eyebrow="A LITTLE ROOM FOR YOUR THOUGHTS"
        title="My journals"
        description="Put your day into words. Revisit a reflection, or explore the emotions in your writing."
      />
      <div className="journal-layout">
        <section
          className="card journal-form"
          aria-labelledby="journal-form-heading"
        >
          <div className="section-heading">
            <h2 id="journal-form-heading">
              {editingId !== null ? "Edit your reflection" : "A new reflection"}
            </h2>
            <span className="badge">
              <Icon name="journal" />
              Your journal
            </span>
          </div>
          <p className="muted">
            Start wherever you are. A few words are enough.
          </p>
          <form onSubmit={handleSubmit} aria-busy={saving}>
            <fieldset disabled={busy || loading}>
              <div className="form-field">
                <label htmlFor="journal-title">
                  Title <span className="muted">(optional)</span>
                </label>
                <input
                  id="journal-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={200}
                  placeholder="Today's thoughts"
                />
              </div>
              <div className="form-field">
                <label htmlFor="journal-content">Your journal entry</label>
                <textarea
                  ref={contentInput}
                  id="journal-content"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="What's on your mind today?"
                  rows={7}
                  required
                />
              </div>
              <div className="actions">
                <button type="submit">
                  <Icon name="journal" />
                  {saving
                    ? "Saving…"
                    : editingId !== null
                      ? "Update journal"
                      : "Save journal"}
                </button>
                {editingId !== null && (
                  <button
                    className="button secondary"
                    type="button"
                    onClick={resetForm}
                  >
                    Cancel editing
                  </button>
                )}
              </div>
            </fieldset>
          </form>
        </section>
        <div>
          <Notice type="error">{error}</Notice>
          <Notice type="success">{success}</Notice>
          <div className="section-heading">
            <h2>Your reflections</h2>
            {!loading && (
              <span className="badge">
                {journals.length} {journals.length === 1 ? "entry" : "entries"}
              </span>
            )}
          </div>
          {loading ? (
            <Loading>Loading journals and saved analyses…</Loading>
          ) : error && journals.length === 0 ? null : journals.length === 0 ? (
            <div className="card">
              <EmptyState title="A blank page, a fresh start" icon="journal">
                Your saved reflections will appear here. Use the form above to
                write your first entry.
              </EmptyState>
            </div>
          ) : (
            <div className="stack">
              {journals.map((journal) => {
                const analysis = analysisResults[journal.id];
                return (
                  <article className="card journal-entry" key={journal.id}>
                    <header className="entry-header">
                      <div>
                        <h3>{journal.title || "Untitled journal"}</h3>
                        <div className="entry-meta">
                          <time dateTime={journal.created_at}>
                            {formatDate(journal.created_at, true)}
                          </time>
                        </div>
                      </div>
                      {analysis && (
                        <span className="badge">
                          <Icon name="spark" />
                          Analysis saved
                        </span>
                      )}
                    </header>
                    <p className="journal-content">{journal.content}</p>
                    <div className="actions">
                      <button
                        className="button secondary"
                        type="button"
                        disabled={busy}
                        onClick={() => handleEdit(journal)}
                      >
                        Edit
                        <span className="sr-only">
                          {" "}
                          {journal.title || "journal entry"}
                        </span>
                      </button>
                      <button
                        className="button danger"
                        type="button"
                        disabled={busy}
                        onClick={() => setDeleteId(journal.id)}
                      >
                        Delete
                        <span className="sr-only">
                          {" "}
                          {journal.title || "journal entry"}
                        </span>
                      </button>
                      <button
                        className="button secondary"
                        type="button"
                        onClick={() => handleAnalyze(journal.id)}
                        disabled={busy}
                      >
                        <Icon name="spark" />
                        {analyzingId === journal.id
                          ? "Analyzing…"
                          : analysis
                            ? "Analyze again"
                            : "Analyze with AI"}
                      </button>
                    </div>
                    {analyzingId === journal.id && (
                      <Loading>
                        Exploring sentiment and emotion. The first analysis may
                        take a little longer.
                      </Loading>
                    )}
                    {analysis && (
                      <section
                        className="analysis-panel"
                        aria-label="Saved AI analysis"
                      >
                        <div className="analysis-heading">
                          <Icon name="spark" />
                          <h4>AI reflection</h4>
                        </div>
                        <dl className="analysis-grid">
                          <div className="analysis-metric">
                            <dt>Predicted sentiment</dt>
                            <dd>{analysis.sentiment || "Not available"}</dd>
                            <small>
                              {confidence(analysis.sentiment_confidence)}
                            </small>
                          </div>
                          <div className="analysis-metric">
                            <dt>Predicted emotion</dt>
                            <dd>{analysis.emotion || "Not available"}</dd>
                            <small>
                              {confidence(analysis.emotion_confidence)}
                            </small>
                          </div>
                        </dl>
                        <p>
                          AI predictions describe patterns in your writing.
                          Confidence reflects the model's certainty, not
                          clinical accuracy. These results are not a diagnosis.
                        </p>
                      </section>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <ConfirmDialog
        open={deleteId !== null}
        title="Delete this journal entry?"
        confirmLabel="Delete entry"
        busy={deleting}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
      >
        This permanently deletes this entry and its saved AI analysis. This
        action cannot be undone.
      </ConfirmDialog>
    </main>
  );
}

export default Journals;
