import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Workspace from "./pages/Workspace";
import CompassReport from "./pages/CompassReport";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/compass" element={<CompassReport />} />
          <Route path="*" element={
            <div className="max-w-[1100px] mx-auto w-full h-screen">
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/workspace" element={<Workspace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
