import { useAuth } from './lib/auth-store';
import { AuthForm } from './components/AuthForm';
import { Chat } from './components/Chat';
import { Loader2 } from 'lucide-react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SignIn, SignUp } from '@clerk/clerk-react';

const clerkAppearance = {
  baseTheme: undefined, // Will be overridden by CSS
  variables: {
    colorPrimary: '#ffd700',
    colorBackground: '#000000',
    colorText: '#ffffff',
    colorTextSecondary: '#dbdbdb',
    colorInputBackground: '#0d0d0d',
    colorInputText: '#ffffff',
  },
  elements: {
    rootBox: "cl-rootBox",
    card: "cl-card",
    formButtonPrimary: "cl-formButtonPrimary",
    headerTitle: "cl-headerTitle",
    headerSubtitle: "cl-headerSubtitle",
    footerActionLink: "cl-footerActionLink",
    formFieldInput: "cl-formFieldInput",
    formFieldLabel: "cl-formFieldLabel",
    footer: "cl-footer"
  }
};

const AuthLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex-center" style={{ 
    minHeight: '100vh', 
    width: '100vw',
    padding: '40px', 
    flexDirection: 'column',
    backgroundColor: 'var(--bg-dark)'
  }}>
    <div style={{ marginBottom: '48px', textAlign: 'center' }}>
      <img src="/Logo.png" alt="Breccia" style={{ width: '64px', height: '64px', marginBottom: '24px' }} />
      <h1 style={{ color: 'var(--accent-gold)', fontSize: '32px', marginBottom: '8px', fontWeight: '800' }}>Breccia</h1>
      <p style={{ color: 'var(--text-dim)', fontSize: '15px', fontWeight: '500' }}>Fortress-Grade Identity.</p>
    </div>
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      {children}
    </div>
  </div>
);

function App() {
  const { user, privateKey, loading, profile } = useAuth();

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '100vh', backgroundColor: 'var(--bg-primary)' }}>
        <Loader2 className="animate-spin" size={48} color="var(--accent-gold)" />
      </div>
    );
  }

  // If user is authenticated with Clerk, handle "Fortress" states
  if (user) {
    // If Fortress is not set up OR is locked
    if (!profile?.public_key || !privateKey) {
      return <AuthForm />;
    }
    
    // If all good, show Chat
    return (
      <Routes>
        <Route path="/" element={<Chat />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Not authenticated -> Show Login/Signup routes
  return (
    <Routes>
      <Route path="/sign-in" element={
        <AuthLayout>
          <SignIn appearance={clerkAppearance} routing="path" path="/sign-in" signUpUrl="/sign-up" />
        </AuthLayout>
      } />
      <Route path="/sign-up" element={
        <AuthLayout>
          <SignUp appearance={clerkAppearance} routing="path" path="/sign-up" signInUrl="/sign-in" />
        </AuthLayout>
      } />
      <Route path="*" element={<Navigate to="/sign-in" replace />} />
    </Routes>
  );
}

export default App;
