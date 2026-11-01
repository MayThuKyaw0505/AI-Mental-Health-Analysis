import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

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

    const loadJournals = async () => {
        try {
            setError("");

            const [journalResponse, analysisResponse] =
                await Promise.all([
                    api.get("journals/"),
                    api.get("analysis/history/"),
                ]);

            setJournals(journalResponse.data);

            const resultsByJournal = {};

            analysisResponse.data.forEach((analysis) => {
                resultsByJournal[analysis.journal_entry] = analysis;
            });

            setAnalysisResults(resultsByJournal);

        } catch (error) {
            console.error(error);
            setError("Unable to load journals or analysis results.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadJournals();
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
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this journal entry?")) {
            return;
        }

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
        } catch {
            setError("Unable to delete journal.");
        }
    };

    const handleAnalyze = async (journalId) => {
        setAnalyzingId(journalId);
        setError("");

        try {
            const response = await api.post(
                `analysis/journals/${journalId}/analyze/`
            );

            setAnalysisResults((previous) => ({
                ...previous,
                [journalId]: response.data,
            }));
        } catch (error) {
            console.error("AI analysis failed:", error);
            setError("Unable to analyze this journal entry.");
        } finally {
            setAnalyzingId(null);
        }
    };

    return (
        <main style={{ maxWidth: "750px", margin: "40px auto", padding: "20px" }}>
            <Link to="/dashboard">← Back to Dashboard</Link>

            <h1>My Journal</h1>
            <p>Write about your thoughts and feelings.</p>

            <form onSubmit={handleSubmit}>
                <h2>{editingId !== null ? "Edit Journal" : "New Journal"}</h2>

                <div>
                    <label htmlFor="journal-title">Title</label>
                    <br />
                    <input
                        id="journal-title"
                        type="text"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        maxLength={200}
                        placeholder="Today's thoughts"
                        style={{ width: "100%", padding: "10px" }}
                    />
                </div>

                <div style={{ marginTop: "15px" }}>
                    <label htmlFor="journal-content">Journal Entry</label>
                    <br />
                    <textarea
                        id="journal-content"
                        value={content}
                        onChange={(event) => setContent(event.target.value)}
                        placeholder="How are you feeling today?"
                        rows={7}
                        required
                        style={{ width: "100%", padding: "10px" }}
                    />
                </div>

                <div style={{ marginTop: "15px" }}>
                    <button type="submit" disabled={saving}>
                        {saving
                            ? "Saving..."
                            : editingId !== null
                                ? "Update Journal"
                                : "Save Journal"}
                    </button>

                    {editingId !== null && (
                        <button type="button" onClick={resetForm}>
                            Cancel
                        </button>
                    )}
                </div>
            </form>

            {error && <p role="alert" style={{ color: "crimson" }}>{error}</p>}

            <hr />

            <h2>Previous Entries</h2>

            {loading ? (
                <p>Loading journals...</p>
            ) : journals.length === 0 ? (
                <p>No journal entries yet.</p>
            ) : (
                journals.map((journal) => (
                    <article
                        key={journal.id}
                        style={{
                            border: "1px solid #ddd",
                            borderRadius: "8px",
                            padding: "15px",
                            marginBottom: "15px",
                            overflowWrap: "anywhere",
                        }}
                    >
                        <h3>{journal.title || "Untitled Journal"}</h3>

                        <small>
                            {new Date(journal.created_at).toLocaleString()}
                        </small>

                        <p style={{ whiteSpace: "pre-wrap" }}>
                            {journal.content}
                        </p>

                        <button onClick={() => handleEdit(journal)}>
                            Edit
                        </button>

                        <button onClick={() => handleDelete(journal.id)}>
                            Delete
                        </button>

                        <button
                            type="button"
                            onClick={() => handleAnalyze(journal.id)}
                            disabled={analyzingId !== null}
                        >
                            {analyzingId === journal.id
                                ? "Analyzing..."
                                : "Analyze with AI"}
                        </button>

                        {analysisResults[journal.id] && (
                            <div
                                style={{
                                    marginTop: "15px",
                                    padding: "15px",
                                    backgroundColor: "#f3f7fa",
                                    borderRadius: "8px",
                                    color: "#222",
                                }}
                            >
                                <h4>AI Analysis Result</h4>

                                <p>
                                    <strong>Sentiment:</strong>{" "}
                                    {analysisResults[journal.id].sentiment}
                                </p>

                                <p>
                                    <strong>Sentiment Confidence:</strong>{" "}
                                    {(
                                        analysisResults[journal.id].sentiment_confidence * 100
                                    ).toFixed(1)}%
                                </p>

                                <p>
                                    <strong>Emotion:</strong>{" "}
                                    {analysisResults[journal.id].emotion}
                                </p>

                                <p>
                                    <strong>Emotion Confidence:</strong>{" "}
                                    {(
                                        analysisResults[journal.id].emotion_confidence * 100
                                    ).toFixed(1)}%
                                </p>
                            </div>
                        )}
                    </article>
                ))
            )}
        </main>
    );
}

export default Journals;