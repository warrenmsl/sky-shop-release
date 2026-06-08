import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "./pages/NotFound.tsx";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import ListingTasks from "./pages/ListingTasks";
import MarketCollect from "./pages/MarketCollect";
import Analysis from "./pages/Analysis";
import Assets from "./pages/Assets";
import SettingsCenter from "./pages/SettingsCenter";
import Logs from "./pages/Logs";
import UsersPage from "./pages/UsersPage";
import ApiDocs from "./pages/ApiDocs";
import StoreMonitor from "./pages/StoreMonitor";
import LinkScore from "./pages/LinkScore";
import Suggestions from "./pages/Suggestions";
import Executors from "./pages/Executors";
import Locators from "./pages/Locators";
import Verify from "./pages/Verify";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/listing" element={<ListingTasks />} />
            <Route path="/upload" element={<ListingTasks />} />
            <Route path="/market" element={<MarketCollect />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/monitor" element={<StoreMonitor />} />
            <Route path="/score" element={<LinkScore />} />
            <Route path="/suggestions" element={<Suggestions />} />
            <Route path="/assets" element={<Assets />} />
            <Route path="/executors" element={<Executors />} />
            <Route path="/locators" element={<Locators />} />
            <Route path="/settings" element={<SettingsCenter />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/api-docs" element={<ApiDocs />} />
            <Route path="/verify" element={<Verify />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
