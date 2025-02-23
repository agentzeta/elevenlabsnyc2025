
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import Index from './pages/Index';
import Auth from './pages/Auth';
import JobForm from './pages/JobForm';
import JobManagement from './pages/JobManagement';
import JobDetails from './pages/JobDetails';
import ApplicationFlow from './pages/ApplicationFlow';
import PublicJobView from './pages/PublicJobView';
import NotFound from './pages/NotFound';
import RecruiterDashboard from './components/RecruiterDashboard';
import JobList from './pages/Jobs';

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/jobs/new" element={<JobForm />} />
          <Route path="/jobs/:id/edit" element={<JobForm />} />
          <Route path="/jobs" element={<JobManagement />} />
          <Route path="/jobs/:id" element={<JobDetails />} />
          <Route path="/joblist" element={<JobList />} />
          <Route path="/public/jobs/:id/apply" element={<ApplicationFlow />} />
          <Route path="/public/jobs/:id" element={<PublicJobView />} />
          <Route path="/recruiter-dashboard" element={<RecruiterDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <Toaster />
    </>
  );
}

export default App;
