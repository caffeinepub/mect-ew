import { useState, useEffect } from 'react';
import { Menu, X, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useIsCallerAdmin } from '../hooks/useQueries';
import { useNavigate } from '@tanstack/react-router';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: isAdmin, isLoading: isLoadingAdmin } = useIsCallerAdmin();
  const navigate = useNavigate();

  const isAuthenticated = !!identity;
  const disabled = loginStatus === 'logging-in';

  // Immediately invalidate admin queries when identity changes
  useEffect(() => {
    if (identity) {
      const principalString = identity.getPrincipal().toString();
      console.log('Identity changed, invalidating admin cache for:', principalString);
      queryClient.invalidateQueries({ queryKey: ['isAdmin'] });
    }
  }, [identity, queryClient]);

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
      navigate({ to: '/' });
    } else {
      try {
        await login();
        // Immediately invalidate admin queries after successful login
        queryClient.invalidateQueries({ queryKey: ['isAdmin'] });
      } catch (error: any) {
        console.error('Login error:', error);
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  const handleNavigation = (path: string) => {
    navigate({ to: path });
    setMobileMenuOpen(false);
  };

  const navItems = [
    { path: '/sobre-mi', label: 'Sobre Mí' },
    { path: '/analisis', label: 'Análisis' },
    { path: '/consultorias', label: 'Consultorías' },
    { path: '/mentorias', label: 'Mentorías' },
    { path: '/contacto', label: 'Contacto' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <button 
            onClick={() => handleNavigation('/')}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <img 
              src="/assets/Logo-3.png" 
              alt="MECT EW Logo" 
              className="h-6 w-auto object-contain"
              style={{ 
                maxWidth: '100%',
                height: '1.5rem'
              }}
              onError={(e) => {
                console.error('Logo failed to load');
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">MECT EW</h1>
              {isAuthenticated && !isLoadingAdmin && isAdmin && (
                <Badge variant="outline" className="text-xs border-primary/50 text-primary bg-primary/10">
                  Administrador
                </Badge>
              )}
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                onClick={() => handleNavigation(item.path)}
                className="text-sm text-white hover:text-white hover:bg-white/10"
              >
                {item.label}
              </Button>
            ))}
          </nav>

          {/* Auth and Admin Buttons */}
          <div className="hidden md:flex items-center space-x-2">
            {isAuthenticated && !isLoadingAdmin && isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigation('/admin')}
                className="gap-2 text-white border-white/20 hover:bg-white/10 hover:text-white"
              >
                <Shield className="w-4 h-4" />
                Admin
              </Button>
            )}
            <Button
              onClick={handleAuth}
              disabled={disabled}
              size="sm"
              variant={isAuthenticated ? 'outline' : 'default'}
              className={isAuthenticated ? 'text-white border-white/20 hover:bg-white/10 hover:text-white' : ''}
            >
              {loginStatus === 'logging-in' ? 'Conectando...' : isAuthenticated ? 'Cerrar Sesión' : 'Iniciar Sesión'}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-white hover:bg-white/10 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10">
            <nav className="flex flex-col space-y-2">
              {isAuthenticated && !isLoadingAdmin && isAdmin && (
                <div className="px-3 py-2">
                  <Badge variant="outline" className="text-xs border-primary/50 text-primary bg-primary/10">
                    Administrador
                  </Badge>
                </div>
              )}
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  variant="ghost"
                  onClick={() => handleNavigation(item.path)}
                  className="justify-start text-white hover:bg-white/10 hover:text-white"
                >
                  {item.label}
                </Button>
              ))}
              {isAuthenticated && !isLoadingAdmin && isAdmin && (
                <Button
                  variant="outline"
                  onClick={() => handleNavigation('/admin')}
                  className="justify-start gap-2 text-white border-white/20 hover:bg-white/10 hover:text-white"
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </Button>
              )}
              <Button
                onClick={handleAuth}
                disabled={disabled}
                variant={isAuthenticated ? 'outline' : 'default'}
                className={isAuthenticated ? 'justify-start text-white border-white/20 hover:bg-white/10 hover:text-white' : 'justify-start'}
              >
                {loginStatus === 'logging-in' ? 'Conectando...' : isAuthenticated ? 'Cerrar Sesión' : 'Iniciar Sesión'}
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
