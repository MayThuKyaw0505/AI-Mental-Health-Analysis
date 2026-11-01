import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

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
        (item) => String(item.id) === selectedId
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
        questions.every(
            (question) => answers[question.id] !== undefined
        );

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

            const response = await api.post(
                "assessments/",
                payload
            );

            setResult(response.data);
        } catch (err) {
            console.error("Assessment submission failed:", err);
            setError("Unable to submit assessment. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main
            style={{
                maxWidth: "800px",
                margin: "40px auto",
                padding: "20px",
            }}
        >
            <Link to="/dashboard">← Back to Dashboard</Link>

            <h1>Mental Well-being Assessment</h1>

            <p>
                These questionnaires are screening tools, not
                medical diagnoses.
            </p>

            <label htmlFor="questionnaire">
                <strong>Select Questionnaire</strong>
            </label>

            <br />

            <select
                id="questionnaire"
                value={selectedId}
                onChange={handleSelect}
                style={{ padding: "10px", marginTop: "10px" }}
            >
                <option value="">-- Select --</option>

                {questionnaires.map((questionnaire) => (
                    <option
                        key={questionnaire.id}
                        value={questionnaire.id}
                    >
                        {questionnaire.name}
                    </option>
                ))}
            </select>

            {loading && <p>Loading questionnaires...</p>}

            {error && (
                <p role="alert" style={{ color: "crimson" }}>
                    {error}
                </p>
            )}

            {selectedQuestionnaire && !result && (
                <form onSubmit={handleSubmit}>
                    <h2>{selectedQuestionnaire.name}</h2>

                    <p>
                        Over the last two weeks, how often have you
                        been bothered by the following problems?
                    </p>

                    {questions.map((question, index) => (
                        <fieldset
                            key={question.id}
                            style={{
                                marginBottom: "20px",
                                padding: "15px",
                                border: "1px solid #ddd",
                                borderRadius: "8px",
                            }}
                        >
                            <legend>
                                <strong>
                                    {index + 1}. {question.question_text}
                                </strong>
                            </legend>

                            {ANSWER_OPTIONS.map((option) => (
                                <label
                                    key={option.value}
                                    style={{
                                        display: "block",
                                        margin: "10px 0",
                                    }}
                                >
                                    <input
                                        type="radio"
                                        name={`question-${question.id}`}
                                        value={option.value}
                                        checked={
                                            answers[question.id] === option.value
                                        }
                                        onChange={() =>
                                            handleAnswer(
                                                question.id,
                                                option.value
                                            )
                                        }
                                    />

                                    {" "}
                                    {option.label} ({option.value})
                                </label>
                            ))}
                        </fieldset>
                    ))}

                    <button
                        type="submit"
                        disabled={!allAnswered || submitting}
                    >
                        {submitting
                            ? "Submitting..."
                            : "Submit Assessment"}
                    </button>
                </form>
            )}

            {result && (
                <section
                    style={{
                        marginTop: "25px",
                        padding: "20px",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                    }}
                >
                    <h2>Assessment Result</h2>

                    <p>
                        <strong>Total Score:</strong>{" "}
                        {result.total_score}
                    </p>

                    <p>
                        <strong>Severity:</strong>{" "}
                        {result.severity}
                    </p>

                    <p>
                        This result is a screening score and
                        does not establish a diagnosis.
                    </p>

                    <button
                        type="button"
                        onClick={() => {
                            setResult(null);
                            setAnswers({});
                        }}
                    >
                        Take Assessment Again
                    </button>
                </section>
            )}
        </main>
    );
}

export default Assessments;