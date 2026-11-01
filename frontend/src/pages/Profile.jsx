import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./Profile.css";

function errorMessage(error) {
    const data = error.response?.data;
    if (!data) return "Unable to connect. Please try again.";
    if (typeof data === "string") return "Unable to complete the request. Please try again.";
    return Object.entries(data).map(([field, messages]) => {
        const message = Array.isArray(messages) ? messages.join(" ") : String(messages);
        return ["detail", "non_field_errors"].includes(field)
            ? message
            : `${field.replaceAll("_", " ")}: ${message}`;
    }).join(" ");
}

function Notice({ notice }) {
    if (!notice) return null;
    return <p className={`profile-notice ${notice.type}`} role={notice.type === "error" ? "alert" : "status"}>{notice.text}</p>;
}

function Profile() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [busy, setBusy] = useState("");
    const [profileNotice, setProfileNotice] = useState(null);
    const [passwordNotice, setPasswordNotice] = useState(null);
    const [deleteNotice, setDeleteNotice] = useState(null);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [deletePassword, setDeletePassword] = useState("");
    const [confirmDeletion, setConfirmDeletion] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        api.get("auth/profile/", { signal: controller.signal })
            .then(({ data }) => {
                setProfile(data);
                setUsername(data.username);
                setEmail(data.email);
            })
            .catch((error) => {
                if (!controller.signal.aborted) setLoadError(errorMessage(error));
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, []);

    const signOut = (message) => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        navigate("/login", { replace: true, state: { message } });
    };

    const saveProfile = async (event) => {
        event.preventDefault();
        setProfileNotice(null);
        if (!username.trim() || !email.trim()) {
            setProfileNotice({ type: "error", text: "Username and email are required." });
            return;
        }
        setBusy("profile");
        try {
            const { data } = await api.patch("auth/profile/", { username: username.trim(), email: email.trim() });
            setProfile(data);
            setUsername(data.username);
            setEmail(data.email);
            setProfileNotice({ type: "success", text: "Your profile has been updated." });
        } catch (error) {
            setProfileNotice({ type: "error", text: errorMessage(error) });
        } finally {
            setBusy("");
        }
    };

    const changePassword = async (event) => {
        event.preventDefault();
        setPasswordNotice(null);
        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordNotice({ type: "error", text: "All password fields are required." });
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordNotice({ type: "error", text: "The new passwords do not match." });
            return;
        }
        setBusy("password");
        try {
            await api.post("auth/change-password/", {
                current_password: currentPassword,
                new_password: newPassword,
                confirm_new_password: confirmPassword,
            });
            signOut("Password changed successfully. Please sign in with your new password.");
        } catch (error) {
            setPasswordNotice({ type: "error", text: errorMessage(error) });
        } finally {
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setBusy("");
        }
    };

    const deleteAccount = async (event) => {
        event.preventDefault();
        setDeleteNotice(null);
        if (!deletePassword || !confirmDeletion) {
            setDeleteNotice({ type: "error", text: "Enter your password and confirm deletion." });
            return;
        }
        setBusy("delete");
        try {
            await api.delete("auth/delete-account/", {
                data: { password: deletePassword, confirm_deletion: confirmDeletion },
            });
            signOut("Your account and associated personal data have been deleted.");
        } catch (error) {
            setDeleteNotice({ type: "error", text: errorMessage(error) });
        } finally {
            setDeletePassword("");
            setBusy("");
        }
    };

    return (
        <main className="profile-page">
            <Link to="/dashboard">← Back to Dashboard</Link>
            <h1>Profile and Privacy Settings</h1>
            {loading && <p role="status">Loading your profile...</p>}
            {loadError && <p role="alert">{loadError} Please reload this page to try again.</p>}
            {profile && <>
                <section className="profile-section" aria-labelledby="profile-heading">
                    <h2 id="profile-heading">Your profile</h2>
                    <p>Registered: <time dateTime={profile.date_joined}>{new Date(profile.date_joined).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</time></p>
                    <form onSubmit={saveProfile}>
                        <fieldset disabled={Boolean(busy)}>
                            <label htmlFor="profile-username">Username</label>
                            <input id="profile-username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} maxLength={150} required />
                            <label htmlFor="profile-email">Email address</label>
                            <input id="profile-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} required />
                            <button type="submit">{busy === "profile" ? "Saving..." : "Save changes"}</button>
                        </fieldset>
                        <Notice notice={profileNotice} />
                    </form>
                </section>

                <section className="profile-section" aria-labelledby="password-heading">
                    <h2 id="password-heading">Change password</h2>
                    <p>Use at least 8 characters. Avoid common passwords, entirely numeric passwords, or passwords similar to your personal details. After saving, sign in again on all devices.</p>
                    <form onSubmit={changePassword}>
                        <fieldset disabled={Boolean(busy)}>
                            <label htmlFor="current-password">Current password</label>
                            <input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
                            <label htmlFor="new-password">New password</label>
                            <input id="new-password" type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
                            <label htmlFor="confirm-password">Confirm new password</label>
                            <input id="confirm-password" type="password" autoComplete="new-password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
                            <button type="submit">{busy === "password" ? "Changing password..." : "Change password"}</button>
                        </fieldset>
                        <Notice notice={passwordNotice} />
                    </form>
                </section>

                <section className="profile-section" aria-labelledby="privacy-heading">
                    <h2 id="privacy-heading">Privacy and your data</h2>
                    <p>This university prototype stores your username, email address, journal entries, saved AI sentiment and emotion analyses, assessment scores, and individual responses in the application's local PostgreSQL database. Records are linked to your account, and authenticated application endpoints restrict access to your own records.</p>
                    <p>Journal text is processed by AI models running in the backend. Model files may be downloaded from Hugging Face when first used. Passwords are stored as secure hashes. Journal and assessment content is not encrypted separately in the database; anyone with administrative database access may read it.</p>
                    <p>This application supports self-reflection and mental health screening. It does not provide medical diagnosis or treatment. AI results and screening scores can be inaccurate and do not replace advice from a qualified professional.</p>
                    <p>Deleting your account permanently removes your profile, journals, saved AI analyses, assessments, and responses from the active application database. Any separately made backups would need to be removed separately.</p>
                </section>

                <section className="profile-section profile-danger" aria-labelledby="delete-heading">
                    <h2 id="delete-heading">Delete account</h2>
                    <p>This action is permanent and cannot be undone. Confirm below only if you want to delete your account and all associated personal data.</p>
                    <form onSubmit={deleteAccount}>
                        <fieldset disabled={Boolean(busy)}>
                            <label htmlFor="delete-password">Your current password</label>
                            <input id="delete-password" type="password" autoComplete="current-password" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} required />
                            <label className="profile-confirm" htmlFor="confirm-deletion">
                                <input id="confirm-deletion" type="checkbox" checked={confirmDeletion} onChange={(event) => setConfirmDeletion(event.target.checked)} required />
                                I understand that my account and associated personal data will be permanently deleted.
                            </label>
                            <button className="profile-delete" type="submit" disabled={!confirmDeletion}>{busy === "delete" ? "Deleting account..." : "Permanently delete my account"}</button>
                        </fieldset>
                        <Notice notice={deleteNotice} />
                    </form>
                </section>
            </>}
        </main>
    );
}

export default Profile;
