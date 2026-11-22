import { useId } from "react";

export default function SafetyNotice({ historical = false }) {
  const headingId = useId();
  return (
    <section className="notice" aria-labelledby={headingId} role="status">
      <h3 id={headingId}>You deserve support</h3>
      <p>
        {historical
          ? "This PHQ-9 check-in recorded"
          : "Your response to PHQ-9 question 9 indicates"}{" "}
        thoughts of death or self-harm on at least some days. This deserves
        attention, even when the total score is low. It does not automatically
        mean you are in immediate danger.
      </p>
      <p>
        Consider speaking with a qualified mental health professional or a
        trusted person who can support you. This application cannot determine
        suicide risk and is not monitored for emergencies.
      </p>
      <p>
        If you are in immediate danger, have already harmed yourself, or feel
        you might act on these thoughts, contact local emergency services or go
        to the nearest emergency department now. If possible, ask someone you
        trust to stay with you.
      </p>
    </section>
  );
}
