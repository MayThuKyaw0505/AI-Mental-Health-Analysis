export function assessmentType(item) {
  const name = String(
    item.questionnaire_name ??
      item.questionnaire?.name ??
      item.questionnaire ??
      "",
  ).toUpperCase();
  if (name.includes("PHQ")) return "PHQ-9";
  if (name.includes("GAD")) return "GAD-7";
  return name;
}

export function formatDate(value, includeTime = false) {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export function apiError(
  error,
  fallback = "Unable to complete the request. Please try again.",
) {
  const data = error.response?.data;
  if (!error.response)
    return "Unable to connect. Check that the backend is running and try again.";
  if (!data || typeof data !== "object") return fallback;
  return (
    Object.entries(data)
      .map(([field, messages]) => {
        const message = Array.isArray(messages)
          ? messages.join(" ")
          : String(messages);
        return ["detail", "non_field_errors"].includes(field)
          ? message
          : `${field.replaceAll("_", " ")}: ${message}`;
      })
      .join(" ") || fallback
  );
}
