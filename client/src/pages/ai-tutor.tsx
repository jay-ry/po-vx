import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function AiTutor() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="h-screen flex flex-col md:flex-row">
      {/* Mobile sidebar (shown when toggled) */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={toggleSidebar}>
          <div className="absolute top-0 left-0 bottom-0 w-64 bg-primary" onClick={(e) => e.stopPropagation()}>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Desktop sidebar (always visible on md+) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={toggleSidebar} />

        <main className="flex-1 overflow-y-auto bg-neutrals-100 p-4 pb-16 md:pb-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">AI Tutor</h1>
            <p className="mb-8">This AI tutor can help you learn about VX Academy values, healthcare practices, and course content.</p>
            
            {/* Container for the embedded chat */}
            <div className="h-[700px] w-full rounded-lg shadow-lg overflow-hidden">
              <iframe 
                src="https://ai.potential.com/chat/68049d13024d653c8feb0eec" 
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="VBB AI Coach"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              ></iframe>
            </div>
          </div>
        </main>

        <MobileNav />
      </div>
    </div>
  );
}
