import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useIsCallerAdmin } from '../hooks/useQueries';
import AdminPanel from '../components/AdminPanel';
import { Button } from '@/components/ui/button';
import { Shield, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useNavigate } from '@tanstack/react-router';

export default function AdminPage() {
  const { identity, login, loginStatus } = useInternetIdentity();
  const { data: isAdmin, isLoading } = useIsCallerAdmin();
  const navigate = useNavigate();

  const isAuthenticated = !!identity;
  const disabled = loginStatus === 'logging-in';

  if (!isAuthenticated) {
    return (
      <main className="pt-20 min-h-screen flex items-center justify-center">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Panel de Administración</h1>
            <p className="text-muted-foreground">
              Debes iniciar sesión para acceder al panel de administración
            </p>
            <Button onClick={login} disabled={disabled} size="lg">
              {disabled ? 'Conectando...' : 'Iniciar Sesión'}
            </Button>
          </div>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="pt-20 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando permisos...</p>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="pt-20 min-h-screen flex items-center justify-center">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto space-y-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Acceso no autorizado</AlertTitle>
              <AlertDescription>
                No tienes permisos para acceder al panel de administración. Solo el administrador del sitio puede acceder a esta sección.
              </AlertDescription>
            </Alert>
            <div className="text-center">
              <Button onClick={() => navigate({ to: '/' })} variant="outline">
                Volver al Inicio
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-20">
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <AdminPanel />
          </div>
        </div>
      </section>
    </main>
  );
}
