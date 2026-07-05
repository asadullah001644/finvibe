export function isProfilesTableMissing(error: {
  code?: string;
  message?: string;
} | null): boolean {
  if (!error) {
    return false;
  }

  const message = error.message ?? "";
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    message.includes("profiles") ||
    message.includes("schema cache")
  );
}

export function isUserIdColumnMissing(error: {
  code?: string;
  message?: string;
} | null): boolean {
  if (!error) {
    return false;
  }

  const message = error.message ?? "";
  return message.includes("user_id") || message.includes("column");
}

export function isSchemaNotReady(error: {
  code?: string;
  message?: string;
} | null): boolean {
  return isProfilesTableMissing(error) || isUserIdColumnMissing(error);
}
