import PageRouteSkeleton from "@/components/PageRouteSkeleton";

export default function AppRouteLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading page"
      className="min-h-[50vh] pt-2"
    >
      <PageRouteSkeleton />
    </div>
  );
}
