import { useApp } from "@/contexts/AppContext";
import { ShellPage } from "@/components/shell/ShellPage";
import { DevPage } from "@/components/dev/DevPage";

export function App() {
  const { mode } = useApp();
  return mode === "shell" ? <ShellPage /> : <DevPage />;
}
