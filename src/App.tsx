import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Layout from "@/components/Layout";

import Home from "@/pages/Home";
import Categories from "@/pages/Categories";
import TopicsList from "@/pages/TopicsList";
import TopicView from "@/pages/TopicView";
import NewTopic from "@/pages/NewTopic";
import Auth from "@/pages/Auth";
import Profile from "@/pages/Profile";
import Messages from "@/pages/Messages";
import Search from "@/pages/Search";
import Rules from "@/pages/Rules";
import Contacts from "@/pages/Contacts";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/categories/:categoryId" element={<TopicsList />} />
              <Route path="/topics" element={<TopicsList />} />
              <Route path="/topics/new" element={<NewTopic />} />
              <Route path="/topics/:id" element={<TopicView />} />
              <Route path="/login" element={<Auth mode="login" />} />
              <Route path="/register" element={<Auth mode="register" />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/search" element={<Search />} />
              <Route path="/rules" element={<Rules />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
