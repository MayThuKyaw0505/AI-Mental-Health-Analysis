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
  if (["ECONNABORTED", "ETIMEDOUT"].includes(error.code))
    return "The request took too long. Its outcome may be unknown. Reload to check before trying again.";
  if (!error.response)
    return "Unable to connect. Check that the backend is running and try again.";
  const status = error.response.status;
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403)
    return "You do not have permission to perform this action.";
  if (status === 404)
    return "This record was not found or is not available to your account.";
  if (status >= 500)
    return status === 503
      ? "This service is temporarily unavailable. Please try again later."
      : "The server couldn't complete the request. Please try again later.";
  if (!data || typeof data !== "object") return fallback;
  const messages = (value) => {
    if (Array.isArray(value))
      return value.map(messages).filter(Boolean).join(" ");
    if (value && typeof value === "object")
      return Object.values(value).map(messages).filter(Boolean).join(" ");
    return typeof value === "string" ? value : "";
  };
  return (
    Object.entries(data)
      .map(([field, value]) => {
        const message = messages(value);
        return ["detail", "error", "non_field_errors"].includes(field)
          ? message
          : `${field.replaceAll("_", " ")}: ${message}`;
      })
      .filter(Boolean)
      .join(" ") || fallback
  );
}
