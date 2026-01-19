
import { Amplify } from 'aws-amplify';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import outputs from "../amplify_outputs.json";

// Hooks
import { useManagedAuth } from './hooks/useManagedAuth';

// Context & Components
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navigation } from './components/Navigation';

// Pages - General
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { UserDashboard } from './pages/UserDashboard';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { UserManagement } from './pages/UserManagement';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { ProfilePage } from './pages/ProfilePage';

// Pages - Vacation
import { MyVacations } from './pages/vacation/MyVacations';
import { PendingApprovals } from './pages/vacation/PendingApprovals';

// Pages - Organization
import { ManageHierarchy } from './pages/organization/ManageHierarchy';

// Pages - Audit
import { AuditDashboard } from './pages/audit/AuditDashboard';

// Configurar Amplify con OAuth usando variables de entorno de .env.local
const configureAmplify = () => {
    // Hacer una copia del config para modificarlo
    const config = JSON.parse(JSON.stringify(outputs));

    // Usar variables de entorno para la configuración de OAuth
    const cognitoDomain = import.meta.env.VITE_COGNITO_DOMAIN || 'ad-studios.auth.us-east-1.amazoncognito.com';
    const redirectSignIn = import.meta.env.VITE_OAUTH_REDIRECT_SIGN_IN || 'http://localhost:5173/';
    const redirectSignOut = import.meta.env.VITE_OAUTH_REDIRECT_SIGN_OUT || 'http://localhost:5173/';
    const oauthScopes = import.meta.env.VITE_OAUTH_SCOPES?.split(',') || ['openid', 'email', 'profile'];

    // Configurar OAuth con variables de entorno
    if (config.auth) {
        if (!config.auth.oauth) {
            config.auth.oauth = {};
        }
        config.auth.oauth.domain = cognitoDomain;
        config.auth.oauth.redirect_sign_in_uri = [redirectSignIn];
        config.auth.oauth.redirect_sign_out_uri = [redirectSignOut];
        config.auth.oauth.scopes = oauthScopes;
        config.auth.oauth.response_type = import.meta.env.VITE_OAUTH_RESPONSE_TYPE || 'code';
    }

    return config;
};

Amplify.configure(configureAmplify());

// Componente interno que maneja la autenticación
function AppContent() {
    const { isAuthenticated, isLoading, signOut } = useManagedAuth();

    // Mostrar loading mientras se verifica la autenticación
    if (isLoading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#fff',
                fontSize: '1.2rem',
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        border: '4px solid rgba(255,255,255,0.2)',
                        borderTopColor: '#3b82f6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px',
                    }} />
                    <style>
                        {`@keyframes spin { to { transform: rotate(360deg); } }`}
                    </style>
                    Cargando...
                </div>
            </div>
        );
    }

    // Si no está autenticado, mostrar página de login
    if (!isAuthenticated) {
        return <LoginPage />;
    }

    // Usuario autenticado - mostrar la aplicación
    return (
        <BrowserRouter>
            <AuthProvider>
                <div style={{
                    minHeight: '100vh',
                    backgroundColor: '#f5f6fa',
                    colorScheme: 'light',
                    color: '#212529',
                }}>
                    <Navigation onSignOut={signOut} />

                    <Routes>
                        {/* Rutas públicas (para usuarios autenticados) */}
                        <Route path="/" element={<HomePage />} />
                        <Route path="/dashboard" element={<UserDashboard />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/unauthorized" element={<UnauthorizedPage />} />

                        {/* Rutas de Vacaciones */}
                        <Route path="/vacations" element={<MyVacations />} />
                        <Route
                            path="/approvals"
                            element={
                                <ProtectedRoute requiredRoles={['admin']}>
                                    <PendingApprovals />
                                </ProtectedRoute>
                            }
                        />

                        {/* Rutas de Organización */}
                        <Route
                            path="/organization"
                            element={
                                <ProtectedRoute requiredRoles={['super_admin']}>
                                    <ManageHierarchy />
                                </ProtectedRoute>
                            }
                        />

                        {/* Rutas protegidas para Super Admin */}
                        <Route
                            path="/super-admin"
                            element={
                                <ProtectedRoute requiredRoles={['super_admin']}>
                                    <SuperAdminDashboard />
                                </ProtectedRoute>
                            }
                        />

                        {/* Auditoría - Solo Super Admin */}
                        <Route
                            path="/audit"
                            element={
                                <ProtectedRoute requiredRoles={['super_admin']}>
                                    <AuditDashboard />
                                </ProtectedRoute>
                            }
                        />

                        {/* Gestión de usuarios - Admin y Super Admin */}
                        <Route
                            path="/users"
                            element={
                                <ProtectedRoute requiredRoles={['admin']}>
                                    <UserManagement />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </div>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default function App() {
    return <AppContent />;
}
