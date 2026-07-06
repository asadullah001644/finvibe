"use client";

import { usePathname } from "next/navigation";
import { PageSkeletonByVariant } from "@/components/skeletons/PageSkeletonByVariant";
import { useAppNavigation } from "@/components/NavigationLoadingProvider";
import { resolvePageSkeletonVariant } from "@/lib/pageSkeleton";

interface PageRouteSkeletonProps {
  pendingHref?: string | null;
}

export default function PageRouteSkeleton({
  pendingHref: pendingHrefOverride,
}: PageRouteSkeletonProps) {
  const pathname = usePathname();
  const { pendingHref: navigationPendingHref } = useAppNavigation();
  const pendingHref = pendingHrefOverride ?? navigationPendingHref;
  const variant = resolvePageSkeletonVariant(pathname, pendingHref);

  return <PageSkeletonByVariant variant={variant} />;
}
