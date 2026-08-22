import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

// Layouts — lazy-loaded to keep sidebar/nav code out of initial bundle
const AuthenticatedLayout = lazy(() => import('@/components/layout/authenticated-layout').then(m => ({ default: m.AuthenticatedLayout })))
const PublicLayout = lazy(() => import('@/components/layout/public-layout').then(m => ({ default: m.PublicLayout })))
const TenantLayout = lazy(() => import('@/features/tenant/components/TenantLayout').then(m => ({ default: m.TenantLayout })))

// ─── Lazy-loaded screens (code-splitting for smaller initial bundle) ───

// Authenticated — Dashboard
const HomePage = lazy(() => import('@/screens/HomePage').then(m => ({ default: m.HomePage })))
const QuickSetupScreen = lazy(() => import('@/screens/QuickSetupScreen').then(m => ({ default: m.QuickSetupScreen })))
const PGLocationsScreen = lazy(() => import('@/screens/pg-locations/PGLocationsScreen').then(m => ({ default: m.PGLocationsScreen })))
const PGDetailsScreen = lazy(() => import('@/screens/pg-locations/PGDetailsScreen').then(m => ({ default: m.PGDetailsScreen })))
const EmployeesScreen = lazy(() => import('@/screens/employees/EmployeesScreen').then(m => ({ default: m.EmployeesScreen })))
const EmployeeDetailsScreen = lazy(() => import('@/screens/employees/EmployeeDetailsScreen').then(m => ({ default: m.EmployeeDetailsScreen })))
const EmployeePermissionOverridesScreen = lazy(() => import('@/screens/employees/EmployeePermissionOverridesScreen').then(m => ({ default: m.EmployeePermissionOverridesScreen })))
const TenantsScreen = lazy(() => import('@/screens/tenants/TenantsScreen').then(m => ({ default: m.TenantsScreen })))
const UpcomingVacanciesScreen = lazy(() => import('@/screens/tenants/UpcomingVacanciesScreen').then(m => ({ default: m.UpcomingVacanciesScreen })))
const TenantFormScreen = lazy(() => import('@/screens/tenants/TenantFormScreen').then(m => ({ default: m.TenantFormScreen })))
const TenantDetailsScreen = lazy(() => import('@/screens/tenants/TenantDetailsScreen').then(m => ({ default: m.TenantDetailsScreen })))
const RentPaymentsScreen = lazy(() => import('@/screens/payments/RentPaymentsScreen').then(m => ({ default: m.RentPaymentsScreen })))
const AdvancePaymentsScreen = lazy(() => import('@/screens/payments/AdvancePaymentsScreen').then(m => ({ default: m.AdvancePaymentsScreen })))
const RefundPaymentsScreen = lazy(() => import('@/screens/payments/RefundPaymentsScreen').then(m => ({ default: m.RefundPaymentsScreen })))
const PaymentsScreen = lazy(() => import('@/screens/payments/PaymentsScreen').then(m => ({ default: m.PaymentsScreen })))
const VisitorsScreen = lazy(() => import('@/screens/visitors/VisitorsScreen').then(m => ({ default: m.VisitorsScreen })))
const VisitorFormScreen = lazy(() => import('@/screens/visitors/VisitorFormScreen').then(m => ({ default: m.VisitorFormScreen })))
const VisitorDetailsScreen = lazy(() => import('@/screens/visitors/VisitorDetailsScreen').then(m => ({ default: m.VisitorDetailsScreen })))
const SettingsScreen = lazy(() => import('@/screens/settings/SettingsScreen').then(m => ({ default: m.SettingsScreen })))
const UserProfileScreen = lazy(() => import('@/screens/settings/UserProfileScreen').then(m => ({ default: m.UserProfileScreen })))
const TicketsScreen = lazy(() => import('@/screens/tickets/TicketsScreen').then(m => ({ default: m.TicketsScreen })))
const RoomsScreen = lazy(() => import('@/screens/rooms/RoomsScreen').then(m => ({ default: m.RoomsScreen })))
const RoomDetailsScreen = lazy(() => import('@/screens/rooms/RoomDetailsScreen').then(m => ({ default: m.RoomDetailsScreen })))
const RoomElectricityBillsScreen = lazy(() => import('@/screens/rooms/RoomElectricityBillsScreen').then(m => ({ default: m.RoomElectricityBillsScreen })))
const ExpensesScreen = lazy(() => import('@/screens/expenses/ExpensesScreen').then(m => ({ default: m.ExpensesScreen })))
const AuthSubscriptionsScreen = lazy(() => import('@/screens/subscription/AuthSubscriptionsScreen').then(m => ({ default: m.AuthSubscriptionsScreen })))
const SubscriptionConfirmScreen = lazy(() => import('@/screens/subscription/SubscriptionConfirmScreen').then(m => ({ default: m.SubscriptionConfirmScreen })))
const SubscriptionHistoryScreen = lazy(() => import('@/screens/subscription/SubscriptionHistoryScreen').then(m => ({ default: m.SubscriptionHistoryScreen })))
const FaqScreen = lazy(() => import('@/screens/faq/FaqScreen').then(m => ({ default: m.FaqScreen })))

// Public — landing page eagerly loaded for fast first paint
import { PublicHome } from '@/screens/PublicHome'

// Public — auth & directory screens lazy-loaded to reduce initial bundle
const RoleSelectionScreen = lazy(() => import('@/screens/auth/RoleSelectionScreen').then(m => ({ default: m.RoleSelectionScreen })))
const LoginScreen = lazy(() => import('@/screens/auth/LoginScreen').then(m => ({ default: m.LoginScreen })))
const TenantLoginScreen = lazy(() => import('@/screens/auth/TenantLoginScreen').then(m => ({ default: m.TenantLoginScreen })))
const SignupScreen = lazy(() => import('@/screens/auth/SignupScreen').then(m => ({ default: m.SignupScreen })))
const PgDirectoryScreen = lazy(() => import('@/screens/public/PgDirectoryScreen').then(m => ({ default: m.PgDirectoryScreen })))
const PgLocationScreen = lazy(() => import('@/screens/public/PgLocationScreen').then(m => ({ default: m.PgLocationScreen })))

// Public — lazy-loaded policy/info pages
const AboutUsScreen = lazy(() => import('@/screens/public/AboutUsScreen').then(m => ({ default: m.AboutUsScreen })))
const ContactUsScreen = lazy(() => import('@/screens/public/ContactUsScreen').then(m => ({ default: m.ContactUsScreen })))
const PgDetailsScreen = lazy(() => import('@/screens/public/PgDetailsScreen').then(m => ({ default: m.PgDetailsScreen })))
const PrivacyScreen = lazy(() => import('@/screens/public/PrivacyScreen').then(m => ({ default: m.PrivacyScreen })))
const RefundPolicyScreen = lazy(() => import('@/screens/public/RefundPolicyScreen').then(m => ({ default: m.RefundPolicyScreen })))
const SoftwareServicesScreen = lazy(() => import('@/screens/public/SoftwareServicesScreen').then(m => ({ default: m.SoftwareServicesScreen })))
const TermsScreen = lazy(() => import('@/screens/public/TermsScreen').then(m => ({ default: m.TermsScreen })))
const SubscriptionsScreen = lazy(() => import('@/screens/subscription/SubscriptionsScreen').then(m => ({ default: m.SubscriptionsScreen })))
const BlogListScreen = lazy(() => import('@/screens/public/BlogListScreen').then(m => ({ default: m.BlogListScreen })))
const BlogPostScreen = lazy(() => import('@/screens/public/BlogPostScreen').then(m => ({ default: m.BlogPostScreen })))

// Tenant portal
const TenantDashboardScreen = lazy(() => import('@/features/tenant/screens/TenantDashboardScreen').then(m => ({ default: m.TenantDashboardScreen })))
const TenantPGDetailsScreen = lazy(() => import('@/features/tenant/screens/TenantPGDetailsScreen').then(m => ({ default: m.TenantPGDetailsScreen })))
const TenantRoomScreen = lazy(() => import('@/features/tenant/screens/TenantRoomScreen').then(m => ({ default: m.TenantRoomScreen })))
const TenantPaymentsScreen = lazy(() => import('@/features/tenant/screens/TenantPaymentsScreen').then(m => ({ default: m.TenantPaymentsScreen })))
const TenantTicketsScreen = lazy(() => import('@/features/tenant/screens/TenantTicketsScreen').then(m => ({ default: m.TenantTicketsScreen })))
const TenantSettingsScreen = lazy(() => import('@/features/tenant/screens/TenantSettingsScreen').then(m => ({ default: m.TenantSettingsScreen })))

// ─── Loading fallback ───

function RouteLoader() {
  return (
    <div className='flex min-h-[60vh] items-center justify-center'>
      <Loader2 className='size-8 animate-spin text-primary' />
    </div>
  )
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        {/* Authenticated routes - all under /dashboard prefix */}
        <Route element={<AuthenticatedLayout />}>
          <Route path='/dashboard' element={<HomePage />} />
          <Route path='/quick-setup' element={<QuickSetupScreen />} />
          <Route path='/pg-locations' element={<PGLocationsScreen />} />
          <Route path='/pg-locations/:id' element={<PGDetailsScreen />} />
          <Route path='/employees' element={<EmployeesScreen />} />
          <Route path='/employees/:id' element={<EmployeeDetailsScreen />} />
          <Route path='/employees/:id/permissions' element={<EmployeePermissionOverridesScreen />} />
          <Route path='/tenants' element={<TenantsScreen />} />
          <Route path='/tenants/upcoming-vacancies' element={<UpcomingVacanciesScreen />} />
          <Route path='/tenants/new' element={<TenantFormScreen />} />
          <Route path='/tenants/:id' element={<TenantDetailsScreen />} />
          <Route path='/tenants/:id/edit' element={<TenantFormScreen />} />
          <Route path='/tenants/:id/rent-payments' element={<RentPaymentsScreen />} />
          <Route path='/tenants/:id/advance-payments' element={<AdvancePaymentsScreen />} />
          <Route path='/tenants/:id/refund-payments' element={<RefundPaymentsScreen />} />
          <Route path='/visitors' element={<VisitorsScreen />} />
          <Route path='/visitors/new' element={<VisitorFormScreen />} />
          <Route path='/visitors/:id' element={<VisitorDetailsScreen />} />
          <Route path='/visitors/:id/edit' element={<VisitorFormScreen />} />
          <Route path='/settings' element={<SettingsScreen />} />
          <Route path='/settings/profile' element={<UserProfileScreen />} />
          <Route path='/tickets' element={<TicketsScreen />} />
          <Route path='/rooms' element={<RoomsScreen />} />
          <Route path='/rooms/:id' element={<RoomDetailsScreen />} />
          <Route
            path='/rooms/:id/electricity-bills'
            element={<RoomElectricityBillsScreen />}
          />
          <Route path='/payments' element={<PaymentsScreen />} />
          <Route path='/payments/rent' element={<RentPaymentsScreen />} />
          <Route path='/payments/advance' element={<AdvancePaymentsScreen />} />
          <Route path='/payments/refund' element={<RefundPaymentsScreen />} />
          <Route path='/expenses' element={<ExpensesScreen />} />
          <Route
            path='/subscriptions/manage'
            element={<AuthSubscriptionsScreen />}
          />
          <Route
            path='/subscriptions/confirm'
            element={<SubscriptionConfirmScreen />}
          />
          <Route
            path='/subscriptions/history'
            element={<SubscriptionHistoryScreen />}
          />
          {/* Dashboard policy pages - shown inside app with sidebar */}
          <Route path='/dashboard/faq' element={<FaqScreen />} />
          <Route path='/dashboard/about' element={<AboutUsScreen />} />
          <Route path='/dashboard/terms' element={<TermsScreen />} />
          <Route path='/dashboard/privacy' element={<PrivacyScreen />} />
          <Route
            path='/dashboard/refund-policy'
            element={<RefundPolicyScreen />}
          />
          <Route path='/dashboard/contact' element={<ContactUsScreen />} />
          <Route
            path='/dashboard/software-services'
            element={<SoftwareServicesScreen />}
          />
        </Route>
        {/* Public routes - for logged-out users */}
        <Route element={<PublicLayout />}>
          <Route path='/' element={<PublicHome />} />
          <Route path='/home' element={<PublicHome />} />
          <Route path='/login' element={<RoleSelectionScreen />} />
          <Route path='/owner-login' element={<LoginScreen />} />
          <Route path='/tenant-login' element={<TenantLoginScreen />} />
          <Route path='/signup' element={<SignupScreen />} />
          <Route path='/faq' element={<FaqScreen />} />
          <Route path='/about' element={<AboutUsScreen />} />
          <Route path='/terms' element={<TermsScreen />} />
          <Route path='/privacy' element={<PrivacyScreen />} />
          <Route path='/refund-policy' element={<RefundPolicyScreen />} />
          <Route path='/contact' element={<ContactUsScreen />} />
          <Route path='/software-services' element={<SoftwareServicesScreen />} />
          <Route path='/blog' element={<BlogListScreen />} />
          <Route path='/blog/:slug' element={<BlogPostScreen />} />
          <Route path='/subscriptions' element={<SubscriptionsScreen />} />
          {/* Public PG Directory — no login required */}
          <Route path='/pg-directory' element={<PgDirectoryScreen />} />
          <Route path='/pg-directory/:id' element={<PgDetailsScreen />} />
          {/* Location-based landing pages handled by catch-all below */}
        </Route>
        {/* Tenant routes - for tenant portal */}
        <Route element={<TenantLayout />}>
          <Route path='/tenant-dashboard' element={<TenantDashboardScreen />} />
          <Route path='/tenant-dashboard/pg-details' element={<TenantPGDetailsScreen />} />
          <Route path='/tenant-dashboard/room' element={<TenantRoomScreen />} />
          <Route path='/tenant-dashboard/payments' element={<TenantPaymentsScreen />} />
          <Route path='/tenant-dashboard/tickets' element={<TenantTicketsScreen />} />
          <Route path='/tenant-dashboard/settings' element={<TenantSettingsScreen />} />
        </Route>
        <Route path='*' element={<SmartCatchAll />} />
      </Routes>
    </Suspense>
  )
}

/**
 * SmartCatchAll — handles /pg-in-:citySlug/:areaSlug URLs (React Router v6
 * doesn't support inline params like /pg-in-:citySlug, so we parse manually).
 * Falls back to /login redirect for all other unknown routes.
 */
function SmartCatchAll() {
  const location = useLocation()
  const path = location.pathname

  // Match /pg-in-<citySlug> or /pg-in-<citySlug>/<areaSlug>
  if (path.startsWith('/pg-in-')) {
    const rest = path.slice('/pg-in-'.length) // e.g. "chennai" or "chennai/velacheri"
    const [citySlug, areaSlug] = rest.split('/')
    if (citySlug) {
      return (
        <PublicLayout>
          <PgLocationScreen key={`${citySlug}/${areaSlug ?? ''}`} citySlug={citySlug} areaSlug={areaSlug} />
        </PublicLayout>
      )
    }
  }

  return <Navigate to='/' replace />
}
