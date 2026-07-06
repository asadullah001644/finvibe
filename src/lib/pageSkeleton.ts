export type PageSkeletonVariant =
  | "overview"
  | "categories"
  | "calendar"
  | "insights"
  | "settings"
  | "admin"
  | "admin-user"
  | "default";

export function getPageSkeletonVariant(pathname: string): PageSkeletonVariant {
  if (pathname.startsWith("/categories")) {
    return "categories";
  }

  if (pathname.startsWith("/calendar")) {
    return "calendar";
  }

  if (pathname.startsWith("/insights")) {
    return "insights";
  }

  if (pathname.startsWith("/settings")) {
    return "settings";
  }

  if (pathname.startsWith("/admin/users/")) {
    return "admin-user";
  }

  if (pathname.startsWith("/admin")) {
    return "admin";
  }

  if (pathname === "/") {
    return "overview";
  }

  return "default";
}

export function resolvePageSkeletonVariant(
  pathname: string,
  pendingHref?: string | null,
): PageSkeletonVariant {
  if (pendingHref) {
    const targetPath = pendingHref.split("?")[0] ?? pendingHref;
    return getPageSkeletonVariant(targetPath);
  }

  return getPageSkeletonVariant(pathname);
}
