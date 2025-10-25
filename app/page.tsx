import Sidebar from "./components/Sidebar";
import MetricsPanel from "./components/MetricsPanel";
import Globe from "./components/Globe";
import ChatBox from "./components/ChatBox";

export default function Home() {
  return (
    <div className="flex h-screen w-full bg-black overflow-hidden">
      <div className="flex-shrink-0">
        <Sidebar />
      </div>
      <div className="flex-1 flex items-center justify-center relative">
        <Globe />
        <ChatBox />
      </div>
      <div className="flex-shrink-0">
        <MetricsPanel />
      </div>
    </div>
  );
}
