import AppShellProvider from "@/components/AppShellProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShellProvider>{children}</AppShellProvider>;
}
