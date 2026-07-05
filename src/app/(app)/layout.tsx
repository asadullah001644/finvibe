import AppShellProvider from "@/components/AppShellProvider";
import PinAuthBootstrap from "@/components/PinAuthBootstrap";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShellProvider>
      <PinAuthBootstrap />
      {children}
    </AppShellProvider>
  );
}
