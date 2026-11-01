// // import { useNavigate } from "react-router-dom";


// // function Dashboard() {
// //     const navigate = useNavigate();


// //     const handleLogout = () => {
// //         localStorage.removeItem("access_token");
// //         localStorage.removeItem("refresh_token");

// //         navigate("/login");
// //     };


// //     return (
// //         <div>

// //             <h1>Dashboard</h1>

// //             <p>
// //                 Welcome to your mental well-being dashboard.
// //             </p>

// //             <button onClick={handleLogout}>
// //                 Logout
// //             </button>

// //         </div>
// //     );
// // }


// // export default Dashboard;

// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { Link } from "react-router-dom";

// import api from "../api/axios";


// function Dashboard() {
//     const navigate = useNavigate();

//     const [journals, setJournals] =
//         useState([]);


//     useEffect(() => {

//         const loadJournals = async () => {
//             try {
//                 const response =
//                     await api.get("journals/");

//                 setJournals(response.data);

//             } catch (error) {
//                 console.error(
//                     "Unable to load journals:",
//                     error
//                 );
//             }
//         };

//         loadJournals();

//     }, []);


//     const handleLogout = () => {
//         localStorage.removeItem("access_token");
//         localStorage.removeItem("refresh_token");

//         navigate("/login");
//     };


//     return (
//         <div>

//             <h1>Dashboard</h1>

//             <p>
//                 Welcome to your mental well-being dashboard.
//             </p>

//             <p>
//                 Journal entries: {journals.length}
//             </p>

//             <button onClick={handleLogout}>
//                 Logout
//             </button>

//             <Link to="/journals">
//                 <button type="button">My Journal</button>
//             </Link>

//             <Link to="/assessments">
//                 Mental Health Assessment
//             </Link>

//             <Link to="/assessment-history">
//                 View Assessment History
//             </Link>
//         </div>
//     );
// }


// export default Dashboard;


import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

const cardStyle = {
    padding: "20px",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    backgroundColor: "#f8fafc",
    flex: "1 1 180px",
};

const linkStyle = {
    display: "block",
    padding: "14px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    textDecoration: "none",
    color: "#234",
    backgroundColor: "#f8fafc",
};

function Dashboard() {
    const navigate = useNavigate();

    const [journals, setJournals] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const [journalResponse, assessmentResponse] =
                    await Promise.all([
                        api.get("journals/"),
                        api.get("assessments/history/"),
                    ]);

                setJournals(journalResponse.data);
                setAssessments(assessmentResponse.data);
            } catch (err) {
                console.error(err);
                setError("Unable to load dashboard data.");
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, []);

    const getType = (assessment) => {
        const name = String(
            assessment.questionnaire_name ??
            assessment.questionnaire?.name ??
            assessment.questionnaire ??
            ""
        ).toUpperCase();

        if (name.includes("PHQ")) return "PHQ-9";
        if (name.includes("GAD")) return "GAD-7";

        return name;
    };

    const latestAssessment = (type) =>
        [...assessments]
            .filter((item) => getType(item) === type)
            .sort(
                (a, b) =>
                    new Date(b.created_at) -
                    new Date(a.created_at)
            )[0];

    const latestPHQ = latestAssessment("PHQ-9");
    const latestGAD = latestAssessment("GAD-7");

    const recentJournals = [...journals]
        .sort(
            (a, b) =>
                new Date(b.created_at) -
                new Date(a.created_at)
        )
        .slice(0, 3);

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        navigate("/login", { replace: true });
    };

    return (
        <main
            style={{
                maxWidth: "1050px",
                margin: "40px auto",
                padding: "20px",
            }}
        >
            <header
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "15px",
                }}
            >
                <div>
                    <h1>Mental Well-being Dashboard</h1>
                    <p>
                        Your personal reflection and assessment overview.
                    </p>
                </div>

                <button onClick={handleLogout}>
                    Logout
                </button>
            </header>

            {loading && <p>Loading dashboard...</p>}

            {error && (
                <p role="alert" style={{ color: "crimson" }}>
                    {error}
                </p>
            )}

            {!loading && !error && (
                <>
                    <section>
                        <h2>Overview</h2>

                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "15px",
                            }}
                        >
                            <div style={cardStyle}>
                                <h3>Journal Entries</h3>
                                <h2>{journals.length}</h2>
                            </div>

                            <div style={cardStyle}>
                                <h3>Assessments</h3>
                                <h2>{assessments.length}</h2>
                            </div>

                            <div style={cardStyle}>
                                <h3>Latest PHQ-9</h3>
                                <h2>
                                    {latestPHQ
                                        ? `${latestPHQ.total_score} / 27`
                                        : "Not taken"}
                                </h2>
                            </div>

                            <div style={cardStyle}>
                                <h3>Latest GAD-7</h3>
                                <h2>
                                    {latestGAD
                                        ? `${latestGAD.total_score} / 21`
                                        : "Not taken"}
                                </h2>
                            </div>
                        </div>
                    </section>

                    <section style={{ marginTop: "35px" }}>
                        <h2>Quick Access</h2>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fit, minmax(190px, 1fr))",
                                gap: "12px",
                            }}
                        >
                            <Link to="/journals" style={linkStyle}>
                                My Journal
                            </Link>

                            <Link to="/journals" style={linkStyle}>
                                AI Journal Analysis
                            </Link>

                            <Link to="/assessments" style={linkStyle}>
                                Take Assessment
                            </Link>

                            <Link
                                to="/assessment-history"
                                style={linkStyle}
                            >
                                Assessment History
                            </Link>
                        </div>
                    </section>

                    <section style={{ marginTop: "35px" }}>
                        <h2>Recent Journals</h2>

                        {recentJournals.length === 0 ? (
                            <p>No journal entries yet.</p>
                        ) : (
                            recentJournals.map((journal) => (
                                <article
                                    key={journal.id}
                                    style={{
                                        padding: "15px",
                                        marginBottom: "12px",
                                        border: "1px solid #ddd",
                                        borderRadius: "8px",
                                    }}
                                >
                                    <h3>
                                        {journal.title || "Untitled Journal"}
                                    </h3>

                                    <small>
                                        {new Date(
                                            journal.created_at
                                        ).toLocaleDateString()}
                                    </small>

                                    <p>
                                        {journal.content.length > 120
                                            ? journal.content.slice(0, 120) + "..."
                                            : journal.content}
                                    </p>

                                    <Link to="/journals">
                                        View Journal
                                    </Link>
                                </article>
                            ))
                        )}
                    </section>

                    <footer style={{ marginTop: "40px" }}>
                        <p>
                            This application provides self-reflection
                            and screening information. It does not
                            provide medical diagnoses.
                        </p>
                    </footer>
                </>
            )}
        </main>
    );
}

export default Dashboard;
