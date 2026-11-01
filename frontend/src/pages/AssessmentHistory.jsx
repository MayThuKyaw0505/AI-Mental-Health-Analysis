
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";

import api from "../api/axios";

function AssessmentHistory() {
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadHistory = async () => {
            try {
                const response = await api.get(
                    "assessments/history/"
                );

                setAssessments(response.data);
            } catch (err) {
                console.error(err);
                setError("Unable to load assessment history.");
            } finally {
                setLoading(false);
            }
        };

        loadHistory();
    }, []);

    // Supports the questionnaire name returned by
    // our existing Django serializer.
    const getType = (item) => {
        const name = String(
            item.questionnaire_name ??
            item.questionnaire?.name ??
            item.questionnaire ??
            ""
        ).toUpperCase();

        if (name.includes("PHQ")) return "PHQ-9";
        if (name.includes("GAD")) return "GAD-7";

        return name;
    };

    const sorted = [...assessments].sort(
        (a, b) =>
            new Date(a.created_at) - new Date(b.created_at)
    );

    // Each assessment is one point in time.
    // We use separate series for the two questionnaires.
    const chartData = sorted.map((item) => ({
        date: new Date(item.created_at).toLocaleDateString(),
        phq9:
            getType(item) === "PHQ-9"
                ? item.total_score
                : null,
        gad7:
            getType(item) === "GAD-7"
                ? item.total_score
                : null,
    }));

    return (
        <main
            style={{
                maxWidth: "950px",
                margin: "40px auto",
                padding: "20px",
            }}
        >
            <Link to="/dashboard">
                ← Back to Dashboard
            </Link>

            <h1>Assessment History</h1>

            <p>
                Review your previous PHQ-9 and GAD-7
                screening results.
            </p>

            {loading && <p>Loading history...</p>}

            {error && (
                <p role="alert" style={{ color: "crimson" }}>
                    {error}
                </p>
            )}

            {!loading && !error && (
                <>
                    <h2>Score Trends</h2>

                    {assessments.length === 0 ? (
                        <p>No assessment history yet.</p>
                    ) : (
                        <div style={{ width: "100%", height: 320 }}>
                            <ResponsiveContainer>
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />

                                    <XAxis dataKey="date" />

                                    <YAxis
                                        domain={[0, 27]}
                                        allowDecimals={false}
                                    />

                                    <Tooltip />
                                    <Legend />

                                    <Line
                                        type="monotone"
                                        dataKey="phq9"
                                        name="PHQ-9"
                                        stroke="#4776c8"
                                        strokeWidth={2}
                                        connectNulls
                                    />

                                    <Line
                                        type="monotone"
                                        dataKey="gad7"
                                        name="GAD-7"
                                        stroke="#30a183"
                                        strokeWidth={2}
                                        connectNulls
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    <h2>Previous Assessments</h2>

                    {[...assessments].reverse().map((item) => (
                        <article
                            key={item.id}
                            style={{
                                border: "1px solid #ddd",
                                borderRadius: "8px",
                                padding: "15px",
                                marginBottom: "12px",
                            }}
                        >
                            <h3>{getType(item)}</h3>

                            <p>
                                <strong>Date:</strong>{" "}
                                {new Date(
                                    item.created_at
                                ).toLocaleString()}
                            </p>

                            <p>
                                <strong>Total Score:</strong>{" "}
                                {item.total_score}
                            </p>

                            <p>
                                <strong>Severity:</strong>{" "}
                                {item.severity}
                            </p>
                        </article>
                    ))}
                </>
            )}
        </main>
    );
}

export default AssessmentHistory;
