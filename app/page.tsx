import Sidebar from "./components/Sidebar";
import MetricsPanel from "./components/MetricsPanel";
import Globe from "./components/Globe";
import ChatBox from "./components/ChatBox";
import Header from "./components/Header"
import { ThemeToggle } from "./components/ThemeToggle";

export default function Home() {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      {/* Theme Toggle - Top Right */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="shrink-0">
        <Sidebar />
      </div>
      <div className="flex-1 flex items-center justify-center relative">
        <Globe targetLocation={null} />
        <ChatBox />
      </div>
      <div className="shrink-0">
        <MetricsPanel hazardCategory={0} targetArea={""} timeTillLandfall={0} agentCount={0} />
      </div>
    </div>
  );
}
