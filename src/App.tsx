import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "@/context/AppContext";

// Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import DonorDashboard from "./pages/donor/DonorDashboard";
import CreateListingPage from "./pages/donor/CreateListingPage";
import ListingDetailPage from "./pages/ListingDetailPage";
import NGOExplorePage from "./pages/ngo/NGOExplorePage";
import NGOListingDetailPage from "./pages/ngo/NGOListingDetailPage";
import NGORequestsPage from "./pages/ngo/NGORequestsPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ChatPage from "./pages/ChatPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const { isAuthenticated, currentUser } = useApp();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && currentUser && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const HomeRedirect = () => {
  const { isAuthenticated, currentUser } = useApp();
  
  if (!isAuthenticated) return <LandingPage />;
  
  switch (currentUser?.role) {
    case 'donor': return <Navigate to="/donor/dashboard" replace />;
    case 'ngo': return <Navigate to="/ngo/explore" replace />;
    case 'admin': return <Navigate to="/admin/dashboard" replace />;
    default: return <LandingPage />;
  }
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<HomeRedirect />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    
    {/* Donor Routes */}
    <Route path="/donor/dashboard" element={<ProtectedRoute allowedRoles={['donor']}><DonorDashboard /></ProtectedRoute>} />
    <Route path="/donor/create-listing" element={<ProtectedRoute allowedRoles={['donor']}><CreateListingPage /></ProtectedRoute>} />
    <Route path="/donor/listing/:id" element={<ProtectedRoute allowedRoles={['donor']}><ListingDetailPage /></ProtectedRoute>} />
    <Route path="/donor/history" element={<ProtectedRoute allowedRoles={['donor']}><DonorDashboard /></ProtectedRoute>} />
    
    {/* NGO Routes */}
    <Route path="/ngo/explore" element={<ProtectedRoute allowedRoles={['ngo']}><NGOExplorePage /></ProtectedRoute>} />
    <Route path="/ngo/listing/:id" element={<ProtectedRoute allowedRoles={['ngo']}><NGOListingDetailPage /></ProtectedRoute>} />
    <Route path="/ngo/requests" element={<ProtectedRoute allowedRoles={['ngo']}><NGORequestsPage /></ProtectedRoute>} />
    
    {/* Admin Routes */}
    <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
    
    {/* Shared Routes */}
    <Route path="/chat/:listingId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
    
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
