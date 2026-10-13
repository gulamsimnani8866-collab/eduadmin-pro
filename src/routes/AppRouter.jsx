// src/routes/AppRouter.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import ProtectedRoute from './ProtectedRoute'
import AppLayout from '../components/layout/AppLayout'
import Spinner from '../components/ui/Spinner'

const LoginPage = lazy(() => import('../pages/LoginPage'))
const DashboardPage = lazy(() => import('../pages/DashboardPage'))
const CoursesPage = lazy(() => import('../pages/CoursesPage'))
const LiveClassesPage = lazy(() => import('../pages/LiveClassesPage'))
const RecordedClassesPage = lazy(() => import('../pages/RecordedClassesPage'))
const StudyMaterialsPage = lazy(() => import('../pages/StudyMaterialsPage'))
const SyllabusPage = lazy(() => import('../pages/SyllabusPage'))
const ImpQuestionsPage = lazy(() => import('../pages/ImpQuestionsPage'))
const PrevYearPapersPage = lazy(() => import('../pages/PrevYearPapersPage'))
const PremiumCoursesPage = lazy(() => import('../pages/PremiumCoursesPage'))
const NotificationsPage = lazy(() => import('../pages/NotificationsPage'))
const FeedbackPage = lazy(() => import('../pages/FeedbackPage'))
const UsersPage = lazy(() => import('../pages/UsersPage'))
const AnalyticsPage = lazy(() => import('../pages/AnalyticsPage'))
const SettingsPage = lazy(() => import('../pages/SettingsPage'))

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <p className="text-6xl font-bold text-gray-200">404</p>
      <p className="text-gray-500">Page not found</p>
    </div>
  )
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Spinner fullPage />}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Protected — all inside AppLayout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/courses/*" element={<CoursesPage />} />
            <Route path="/live-classes" element={<LiveClassesPage />} />
            <Route path="/recorded-classes" element={<RecordedClassesPage />} />
            <Route path="/study-materials" element={<StudyMaterialsPage />} />
            <Route path="/syllabus" element={<SyllabusPage />} />
            <Route path="/imp-questions" element={<ImpQuestionsPage />} />
            <Route path="/prev-year-papers" element={<PrevYearPapersPage />} />
            <Route path="/premium" element={<PremiumCoursesPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
