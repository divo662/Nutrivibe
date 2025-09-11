import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ProfileSetup from "./pages/ProfileSetup";
import Dashboard from "./pages/Dashboard";
import StripeSuccess from "./pages/StripeSuccess";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import MealPlanAI from "./pages/ai/MealPlanAI";
import RecipesAI from "./pages/ai/RecipesAI";
import ShoppingListAI from "./pages/ai/ShoppingListAI";
import MealPlanView from "./pages/MealPlanView";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SubscriptionProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
                             <Route path="/" element={
                 <ErrorBoundary>
                   <Index />
                 </ErrorBoundary>
               } />
               <Route path="/auth" element={
                 <ErrorBoundary>
                   <Auth />
                 </ErrorBoundary>
               } />
               <Route path="/profile-setup" element={
                 <ProtectedRoute>
                   <ErrorBoundary>
                     <ProfileSetup />
                   </ErrorBoundary>
                 </ProtectedRoute>
               } />
                             <Route path="/dashboard" element={
                 <ProtectedRoute>
                   <ErrorBoundary>
                     <Dashboard />
                   </ErrorBoundary>
                 </ProtectedRoute>
               } />
                             <Route path="/stripe-success" element={
                 <ProtectedRoute>
                   <ErrorBoundary>
                     <StripeSuccess />
                   </ErrorBoundary>
                 </ProtectedRoute>
               } />
               <Route path="/settings" element={
                 <ProtectedRoute>
                   <ErrorBoundary>
                     <Settings />
                   </ErrorBoundary>
                 </ProtectedRoute>
               } />
               <Route path="/ai/meal-plan" element={
                 <ProtectedRoute>
                   <ErrorBoundary>
                     <MealPlanAI />
                   </ErrorBoundary>
                 </ProtectedRoute>
               } />
               <Route path="/ai/recipes" element={
                 <ProtectedRoute>
                   <ErrorBoundary>
                     <RecipesAI />
                   </ErrorBoundary>
                 </ProtectedRoute>
               } />
               <Route path="/ai/shopping" element={
                 <ProtectedRoute>
                   <ErrorBoundary>
                     <ShoppingListAI />
                   </ErrorBoundary>
                 </ProtectedRoute>
               } />
               <Route path="/meal-plan/:id" element={
                 <ProtectedRoute>
                   <ErrorBoundary>
                     <MealPlanView />
                   </ErrorBoundary>
                 </ProtectedRoute>
               } />
                             {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
               <Route path="*" element={
                 <ErrorBoundary>
                   <NotFound />
                 </ErrorBoundary>
               } />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SubscriptionProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
