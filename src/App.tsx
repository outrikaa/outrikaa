import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider, PageLoader } from '@/components/ui';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AppLayout } from '@/components/layout/AppLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';

const Home = lazy(() => import('@/pages/public/Home'));
const Features = lazy(() => import('@/pages/public/Features'));
const Pricing = lazy(() => import('@/pages/public/Pricing'));
const AIEmailWriter = lazy(() => import('@/pages/public/AIEmailWriter'));
const EmailSequences = lazy(() => import('@/pages/public/EmailSequences'));
const LeadManagement = lazy(() => import('@/pages/public/LeadManagement'));
const EmailAnalytics = lazy(() => import('@/pages/public/EmailAnalytics'));
const Deliverability = lazy(() => import('@/pages/public/Deliverability'));
const Integrations = lazy(() => import('@/pages/public/Integrations'));
const About = lazy(() => import('@/pages/public/About'));
const Contact = lazy(() => import('@/pages/public/Contact'));
const Blog = lazy(() => import('@/pages/public/Blog'));
const BlogPost = lazy(() => import('@/pages/public/BlogPost'));
const Docs = lazy(() => import('@/pages/public/Docs'));
const Help = lazy(() => import('@/pages/public/Help'));
const Security = lazy(() => import('@/pages/public/Security'));
const Privacy = lazy(() => import('@/pages/public/Privacy'));
const Terms = lazy(() => import('@/pages/public/Terms'));
const CookiePolicy = lazy(() => import('@/pages/public/CookiePolicy'));
const RefundPolicy = lazy(() => import('@/pages/public/RefundPolicy'));
const Status = lazy(() => import('@/pages/public/Status'));
const Careers = lazy(() => import('@/pages/public/Careers'));
const NotFound = lazy(() => import('@/pages/public/NotFound'));

const Login = lazy(() => import('@/pages/auth/Login'));
const Signup = lazy(() => import('@/pages/auth/Signup'));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'));
const VerifyEmail = lazy(() => import('@/pages/auth/VerifyEmail'));
const Onboarding = lazy(() => import('@/pages/auth/Onboarding'));

const Dashboard = lazy(() => import('@/pages/app/Dashboard'));
const Leads = lazy(() => import('@/pages/app/Leads'));
const LeadDetail = lazy(() => import('@/pages/app/LeadDetail'));
const Campaigns = lazy(() => import('@/pages/app/Campaigns'));
const CampaignNew = lazy(() => import('@/pages/app/CampaignNew'));
const CampaignDetail = lazy(() => import('@/pages/app/CampaignDetail'));
const Sequences = lazy(() => import('@/pages/app/Sequences'));
const SequenceBuilder = lazy(() => import('@/pages/app/SequenceBuilder'));
const AIWriter = lazy(() => import('@/pages/app/AIWriter'));
const Templates = lazy(() => import('@/pages/app/Templates'));
const Mailboxes = lazy(() => import('@/pages/app/Mailboxes'));
const Inbox = lazy(() => import('@/pages/app/Inbox'));
const Analytics = lazy(() => import('@/pages/app/Analytics'));
const Tasks = lazy(() => import('@/pages/app/Tasks'));
const AppIntegrations = lazy(() => import('@/pages/app/Integrations'));
const Billing = lazy(() => import('@/pages/app/Billing'));
const Settings = lazy(() => import('@/pages/app/Settings'));

const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'));
const AdminWorkspaces = lazy(() => import('@/pages/admin/AdminWorkspaces'));
const AdminCampaigns = lazy(() => import('@/pages/admin/AdminCampaigns'));
const AdminEmailActivity = lazy(() => import('@/pages/admin/AdminEmailActivity'));
const AdminSubscriptions = lazy(() => import('@/pages/admin/AdminSubscriptions'));
const AdminPlans = lazy(() => import('@/pages/admin/AdminPlans'));
const AdminAIUsage = lazy(() => import('@/pages/admin/AdminAIUsage'));
const AdminTemplates = lazy(() => import('@/pages/admin/AdminTemplates'));
const AdminIntegrations = lazy(() => import('@/pages/admin/AdminIntegrations'));
const AdminCMS = lazy(() => import('@/pages/admin/AdminCMS'));
const AdminBlog = lazy(() => import('@/pages/admin/AdminBlog'));
const AdminTestimonials = lazy(() => import('@/pages/admin/AdminTestimonials'));
const AdminHelp = lazy(() => import('@/pages/admin/AdminHelp'));
const AdminSupport = lazy(() => import('@/pages/admin/AdminSupport'));
const AdminFeatureFlags = lazy(() => import('@/pages/admin/AdminFeatureFlags'));
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings'));
const AdminAuditLogs = lazy(() => import('@/pages/admin/AdminAuditLogs'));

function Loading() {
  return <PageLoader />;
}

function Protected({ children, admin }: { children: ReactNode; admin?: boolean }) {
  const { session, profile, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) return <Loading />;
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (admin && !isAdmin) return <Navigate to="/app" replace />;
  if (!admin && profile && profile.onboarding_completed === false && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
}

function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <Loading />;
  if (session) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<Loading />}>
              <Routes>
                <Route
                  path="/"
                  element={
                    <PublicLayout>
                      <Home />
                    </PublicLayout>
                  }
                />
                {[
                  ['/features', Features], ['/pricing', Pricing], ['/ai-email-writer', AIEmailWriter],
                  ['/email-sequences', EmailSequences], ['/lead-management', LeadManagement],
                  ['/email-analytics', EmailAnalytics], ['/deliverability', Deliverability],
                  ['/integrations', Integrations], ['/about', About], ['/contact', Contact],
                  ['/docs', Docs], ['/security', Security], ['/privacy', Privacy], ['/terms', Terms],
                  ['/cookie-policy', CookiePolicy], ['/refund-policy', RefundPolicy], ['/status', Status],
                  ['/careers', Careers], ['/help', Help],
                ].map(([path, Comp]) => (
                  <Route
                    key={path as string}
                    path={path as string}
                    element={
                      <PublicLayout>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(() => { const C = Comp as any; return <C />; })()}
                      </PublicLayout>
                    }
                  />
                ))}
                <Route
                  path="/blog"
                  element={
                    <PublicLayout>
                      <Blog />
                    </PublicLayout>
                  }
                />
                <Route
                  path="/blog/:slug"
                  element={
                    <PublicLayout>
                      <BlogPost />
                    </PublicLayout>
                  }
                />
                <Route
                  path="/help/:slug"
                  element={
                    <PublicLayout>
                      <Help />
                    </PublicLayout>
                  }
                />

                <Route path="/login" element={<RedirectIfAuthed><Login /></RedirectIfAuthed>} />
                <Route path="/signup" element={<RedirectIfAuthed><Signup /></RedirectIfAuthed>} />
                <Route path="/forgot-password" element={<RedirectIfAuthed><ForgotPassword /></RedirectIfAuthed>} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/onboarding" element={<Protected><Onboarding /></Protected>} />

                <Route
                  path="/app"
                  element={
                    <Protected>
                      <AppLayout>
                        <Dashboard />
                      </AppLayout>
                    </Protected>
                  }
                />
                <Route
                  path="/app/*"
                  element={
                    <Protected>
                      <AppLayout>
                        <Routes>
                          <Route path="leads" element={<Leads />} />
                          <Route path="leads/:id" element={<LeadDetail />} />
                          <Route path="campaigns" element={<Campaigns />} />
                          <Route path="campaigns/new" element={<CampaignNew />} />
                          <Route path="campaigns/:id" element={<CampaignDetail />} />
                          <Route path="sequences" element={<Sequences />} />
                          <Route path="sequences/:id" element={<SequenceBuilder />} />
                          <Route path="ai-writer" element={<AIWriter />} />
                          <Route path="templates" element={<Templates />} />
                          <Route path="mailboxes" element={<Mailboxes />} />
                          <Route path="inbox" element={<Inbox />} />
                          <Route path="analytics" element={<Analytics />} />
                          <Route path="tasks" element={<Tasks />} />
                          <Route path="integrations" element={<AppIntegrations />} />
                          <Route path="billing" element={<Billing />} />
                          <Route path="settings/*" element={<Settings />} />
                          <Route path="*" element={<Navigate to="/app" replace />} />
                        </Routes>
                      </AppLayout>
                    </Protected>
                  }
                />

                <Route
                  path="/admin/*"
                  element={
                    <Protected admin>
                      <AdminLayout>
                        <Routes>
                          <Route index element={<AdminDashboard />} />
                          <Route path="users" element={<AdminUsers />} />
                          <Route path="workspaces" element={<AdminWorkspaces />} />
                          <Route path="campaigns" element={<AdminCampaigns />} />
                          <Route path="email-activity" element={<AdminEmailActivity />} />
                          <Route path="subscriptions" element={<AdminSubscriptions />} />
                          <Route path="plans" element={<AdminPlans />} />
                          <Route path="ai-usage" element={<AdminAIUsage />} />
                          <Route path="templates" element={<AdminTemplates />} />
                          <Route path="integrations" element={<AdminIntegrations />} />
                          <Route path="cms" element={<AdminCMS />} />
                          <Route path="blog" element={<AdminBlog />} />
                          <Route path="testimonials" element={<AdminTestimonials />} />
                          <Route path="help" element={<AdminHelp />} />
                          <Route path="support" element={<AdminSupport />} />
                          <Route path="feature-flags" element={<AdminFeatureFlags />} />
                          <Route path="settings" element={<AdminSettings />} />
                          <Route path="audit-logs" element={<AdminAuditLogs />} />
                          <Route path="*" element={<Navigate to="/admin" replace />} />
                        </Routes>
                      </AdminLayout>
                    </Protected>
                  }
                />

                <Route
                  path="*"
                  element={
                    <PublicLayout>
                      <NotFound />
                    </PublicLayout>
                  }
                />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
  );
}
