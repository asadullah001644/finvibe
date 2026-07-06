import type { PageSkeletonVariant } from "@/lib/pageSkeleton";
import AdminPageSkeleton from "@/components/skeletons/AdminPageSkeleton";
import AdminUserPageSkeleton from "@/components/skeletons/AdminUserPageSkeleton";
import CalendarPageSkeleton from "@/components/skeletons/CalendarPageSkeleton";
import CategoriesPageSkeleton from "@/components/skeletons/CategoriesPageSkeleton";
import InsightsPageSkeleton from "@/components/skeletons/InsightsPageSkeleton";
import OverviewPageSkeleton from "@/components/skeletons/OverviewPageSkeleton";
import SettingsPageSkeleton from "@/components/skeletons/SettingsPageSkeleton";
import { Skeleton, SkeletonLine } from "@/components/ui/skeleton";

function DefaultPageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading page">
      <Skeleton className="h-8 w-48" />
      <SkeletonLine className="w-full max-w-md" />
      <Skeleton className="h-40 w-full rounded-2xl" />
    </div>
  );
}

export function PageSkeletonByVariant({ variant }: { variant: PageSkeletonVariant }) {
  switch (variant) {
    case "overview":
      return <OverviewPageSkeleton />;
    case "categories":
      return <CategoriesPageSkeleton />;
    case "calendar":
      return <CalendarPageSkeleton />;
    case "insights":
      return <InsightsPageSkeleton />;
    case "settings":
      return <SettingsPageSkeleton />;
    case "admin":
      return <AdminPageSkeleton />;
    case "admin-user":
      return <AdminUserPageSkeleton />;
    default:
      return <DefaultPageSkeleton />;
  }
}
