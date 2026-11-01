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
import Icon from "../components/Icon";
import { EmptyState, Loading, Notice, PageHeader } from "../components/UI";
import { assessmentType, formatDate } from "../utils/format";

function AssessmentHistory() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await api.get("assessments/history/");

        setAssessments(response.data);
      } catch {
        setError("Unable to load assessment history.");
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  const sorted = [...assessments].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at),
  );

  // Each assessment is one point in time.
  // We use separate series for the two questionnaires.
  const chartData = sorted.map((item) => ({
    date: new Date(item.created_at).toLocaleDateString(),
    phq9: assessmentType(item) === "PHQ-9" ? item.total_score : null,
    gad7: assessmentType(item) === "GAD-7" ? item.total_score : null,
  }));

  return (
    <main>
      <PageHeader
        eyebrow="REFLECTION OVER TIME"
        title="Assessment history"
        description="Revisit your check-ins and explore how your screening scores have changed."
      >
        <Link className="button" to="/assessments">
          <Icon name="assessment" />
          New assessment
        </Link>
      </PageHeader>
      {loading && <Loading>Loading your assessment history…</Loading>}
      <Notice type="error">{error}</Notice>
      {!loading &&
        !error &&
        (assessments.length === 0 ? (
          <section className="card">
            <EmptyState
              title="Your check-ins will live here"
              to="/assessments"
              action="Take your first assessment"
              icon="history"
            >
              Once you complete a PHQ-9 or GAD-7 questionnaire, you can revisit
              the result and follow your scores over time.
            </EmptyState>
          </section>
        ) : (
          <>
            <section
              className="card chart-card"
              aria-labelledby="trends-heading"
            >
              <div className="section-heading">
                <div>
                  <h2 id="trends-heading">Your scores over time</h2>
                  <p className="form-help">
                    PHQ-9: 0–27 · GAD-7: 0–21 · Each point is a completed
                    assessment.
                  </p>
                </div>
                <span className="badge">{assessments.length} check-ins</span>
              </div>
              <p className="muted">
                These are screening results, not diagnoses. The table below
                contains every result shown in this chart.
              </p>
              <div
                className="chart-wrap"
                role="group"
                aria-label="PHQ-9 and GAD-7 score trends. Exact dates, scores, and severity are listed in the table below."
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 8, right: 12, bottom: 8, left: -22 }}
                    accessibilityLayer
                  >
                    <CartesianGrid
                      strokeDasharray="3 5"
                      vertical={false}
                      stroke="#e4eae5"
                    />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      minTickGap={30}
                    />
                    <YAxis
                      domain={[0, 27]}
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 10,
                        borderColor: "#dce5e1",
                        fontSize: 13,
                      }}
                    />
                    <Legend iconType="line" wrapperStyle={{ paddingTop: 16 }} />
                    <Line
                      type="monotone"
                      dataKey="phq9"
                      name="PHQ-9"
                      stroke="#286f9a"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      connectNulls
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="gad7"
                      name="GAD-7"
                      stroke="#277656"
                      strokeWidth={2.5}
                      strokeDasharray="6 4"
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      connectNulls
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
            <section className="card" aria-labelledby="past-heading">
              <div className="section-heading">
                <h2 id="past-heading">Previous assessments</h2>
                <span className="muted form-help">Most recent first</span>
              </div>
              <div
                className="table-scroll"
                role="region"
                aria-label="Assessment results"
                tabIndex={0}
              >
                <table>
                  <caption>
                    Scores and severity are reported by the application backend.
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Date</th>
                      <th scope="col">Questionnaire</th>
                      <th scope="col">Score</th>
                      <th scope="col">Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...sorted].reverse().map((item) => (
                      <tr key={item.id}>
                        <td className="history-date">
                          <time dateTime={item.created_at}>
                            {formatDate(item.created_at, true)}
                          </time>
                        </td>
                        <th scope="row" className="questionnaire-name">
                          {assessmentType(item)}
                        </th>
                        <td>
                          <strong>{item.total_score}</strong>
                        </td>
                        <td>
                          <span className="badge">{item.severity}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ))}
    </main>
  );
}

export default AssessmentHistory;
