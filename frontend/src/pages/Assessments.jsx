import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Icon from "../components/Icon";
import { EmptyState, Loading, Notice, PageHeader } from "../components/UI";

const ANSWER_OPTIONS = [
  { value: 0, label: "Not at all" },
  { value: 1, label: "Several days" },
  { value: 2, label: "More than half the days" },
  { value: 3, label: "Nearly every day" },
];

function Assessments() {
  const [questionnaires, setQuestionnaires] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadQuestionnaires = async () => {
      try {
        const response = await api.get("questionnaires/");
        setQuestionnaires(response.data);
      } catch {
        setError("Unable to load questionnaires.");
      } finally {
        setLoading(false);
      }
    };

    loadQuestionnaires();
  }, []);

  const selectedQuestionnaire = questionnaires.find(
    (item) => String(item.id) === selectedId,
  );

  const questions = selectedQuestionnaire?.questions ?? [];

  const handleSelect = (event) => {
    setSelectedId(event.target.value);
    setAnswers({});
    setResult(null);
    setError("");
  };

  const handleAnswer = (questionId, score) => {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: score,
    }));
  };

  const allAnswered =
    questions.length > 0 &&
    questions.every((question) => answers[question.id] !== undefined);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedQuestionnaire || !allAnswered) {
      setError("Please answer every question.");
      return;
    }

    setSubmitting(true);
    setError("");
    setResult(null);

    try {
      const payload = {
        questionnaire: selectedQuestionnaire.id,
        responses: questions.map((question) => ({
          question: question.id,
          score: answers[question.id],
        })),
      };

      const response = await api.post("assessments/", payload);

      setResult(response.data);
    } catch {
      setError("Unable to submit assessment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = questions.filter(
    (question) => answers[question.id] !== undefined,
  ).length;

  return (
    <main>
      <PageHeader
        eyebrow="CHECK IN WITH YOURSELF"
        title="Well-being assessments"
        description="A moment to reflect on the last two weeks, using PHQ-9 and GAD-7 screening questionnaires."
      >
        <Link className="button secondary" to="/assessment-history">
          <Icon name="history" />
          View history
        </Link>
      </PageHeader>
      <section
        className="card assessment-picker"
        aria-labelledby="questionnaire-heading"
      >
        <h2 id="questionnaire-heading">Choose your check-in</h2>
        <p className="muted">
          These questionnaires support screening and self-reflection. They do
          not provide a medical diagnosis.
        </p>
        <label htmlFor="questionnaire">Questionnaire</label>
        <select
          id="questionnaire"
          value={selectedId}
          onChange={handleSelect}
          disabled={loading || submitting}
          aria-describedby="reporting-period"
        >
          <option value="">Select a questionnaire</option>
          {questionnaires.map((questionnaire) => (
            <option key={questionnaire.id} value={questionnaire.id}>
              {questionnaire.name}
            </option>
          ))}
        </select>
        <p className="form-help" id="reporting-period">
          Reporting period: the last two weeks.
        </p>
      </section>
      {loading && <Loading>Loading questionnaires…</Loading>}
      <Notice type="error">{error}</Notice>
      {!loading && !error && questionnaires.length === 0 && (
        <div className="card">
          <EmptyState title="No questionnaires available" icon="assessment">
            The questionnaires haven't been set up yet. Please check with the
            project administrator.
          </EmptyState>
        </div>
      )}
      {selectedQuestionnaire && !result && (
        <form onSubmit={handleSubmit} aria-busy={submitting}>
          <div className="assessment-progress">
            <div className="progress-label">
              <span>{selectedQuestionnaire.name}</span>
              <span id="progress-label">
                {answeredCount} of {questions.length} answered
              </span>
            </div>
            <progress
              value={answeredCount}
              max={questions.length || 1}
              aria-labelledby="progress-label"
            />
          </div>
          <h2>Thinking about the last two weeks…</h2>
          <p className="muted">
            How often have you been bothered by the following problems? Select
            one answer for each question.
          </p>
          {questions.length === 0 && (
            <Notice>This questionnaire has no questions available yet.</Notice>
          )}
          {questions.map((question, index) => (
            <fieldset
              className="question-card"
              key={question.id}
              disabled={submitting}
            >
              <legend>
                {index + 1}. {question.question_text}
              </legend>
              <div className="answer-options">
                {ANSWER_OPTIONS.map((option) => (
                  <label className="answer-option" key={option.value}>
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={option.value}
                      checked={answers[question.id] === option.value}
                      onChange={() => handleAnswer(question.id, option.value)}
                      required
                    />
                    <span>{option.label}</span>
                    <small>{option.value}</small>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <div className="actions">
            <button type="submit" disabled={!allAnswered || submitting}>
              {submitting ? "Saving your assessment…" : "Submit assessment"}
              <Icon name="arrow" />
            </button>
            {!allAnswered && (
              <span className="form-help">
                Answer every question to submit.
              </span>
            )}
          </div>
          {submitting && (
            <Loading>Saving your responses and screening result…</Loading>
          )}
        </form>
      )}
      {result && (
        <section
          className="card result-card"
          aria-labelledby="result-heading"
          role="status"
        >
          <span className="badge">
            <Icon name="assessment" />
            Check-in complete
          </span>
          <h2 id="result-heading">Your assessment result</h2>
          <p className="muted">
            {result.questionnaire || selectedQuestionnaire?.name} · Last two
            weeks
          </p>
          <p className="result-score">
            <span className="sr-only">Total score: </span>
            {result.total_score}
          </p>
          <p>
            <strong>Severity: </strong>
            <span className="badge">{result.severity}</span>
          </p>
          <p className="muted">
            This screening score does not establish a diagnosis. A qualified
            professional can help you understand what your results mean.
          </p>
          <div className="actions">
            <Link className="button" to="/assessment-history">
              View assessment history
            </Link>
            <button
              className="button secondary"
              type="button"
              onClick={() => {
                setResult(null);
                setAnswers({});
              }}
            >
              Take assessment again
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

export default Assessments;
