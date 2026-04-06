import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Mail, Menu, Send, Share2, Shield, X } from "lucide-react";
import { useEffect, useState } from "react";
import logoSrc from "../../public/assets/Logo-4.png";
// Import og-logo-preview to ensure it is included in the build bundle
import ogPreviewSrc from "../../public/assets/generated/og-logo-preview.dim_1200x630.png";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useIsCallerAdmin } from "../hooks/useQueries";

// Export so other modules can reference the og:image path
export const OG_IMAGE_URL = `https://mectelliottwave.com${ogPreviewSrc}`;

const SITE_URL = "https://mectelliottwave.com";
const SITE_TITLE = "MECT EW - Análisis Técnico de Mercados Financieros";

function handleShareSite(channel: "whatsapp" | "telegram" | "email") {
  const message = `${SITE_TITLE}\n${SITE_URL}`;
  let url: string;
  if (channel === "whatsapp") {
    url = `https://wa.me/?text=${encodeURIComponent(message)}`;
  } else if (channel === "telegram") {
    url = `https://t.me/share/url?url=${encodeURIComponent(SITE_URL)}&text=${encodeURIComponent(SITE_TITLE)}`;
  } else {
    url = `mailto:?subject=${encodeURIComponent(SITE_TITLE)}&body=${encodeURIComponent(message)}`;
  }
  window.open(url, "_blank");
}

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: isAdmin, isLoading: isLoadingAdmin } = useIsCallerAdmin();
  const navigate = useNavigate();

  const isAuthenticated = !!identity;
  const disabled = loginStatus === "logging-in";

  // Immediately invalidate admin queries when identity changes
  useEffect(() => {
    if (identity) {
      const principalString = identity.getPrincipal().toString();
      console.log(
        "Identity changed, invalidating admin cache for:",
        principalString,
      );
      queryClient.invalidateQueries({ queryKey: ["isAdmin"] });
    }
  }, [identity, queryClient]);

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
      navigate({ to: "/" });
    } else {
      try {
        await login();
        // Immediately invalidate admin queries after successful login
        queryClient.invalidateQueries({ queryKey: ["isAdmin"] });
      } catch (error: any) {
        console.error("Login error:", error);
        if (error.message === "User is already authenticated") {
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
    { path: "/sobre-mi", label: "Sobre Mí" },
    { path: "/analisis", label: "Análisis" },
    { path: "/consultorias", label: "Consultorías" },
    { path: "/mentorias", label: "Mentorías" },
    { path: "/contacto", label: "Contacto" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <button
            type="button"
            onClick={() => handleNavigation("/")}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <img
              src={logoSrc}
              alt="MECT EW Logo"
              className="h-8 w-auto object-contain"
            />
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                MECT EW
              </h1>
              {isAuthenticated && !isLoadingAdmin && isAdmin && (
                <Badge
                  variant="outline"
                  className="text-xs border-primary/50 text-primary bg-primary/10"
                >
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

          {/* Auth, Share and Admin Buttons */}
          <div className="hidden md:flex items-center space-x-2">
            {/* Share site button - visible to all */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-white hover:text-white hover:bg-white/10"
                  data-ocid="header.share_site_button"
                >
                  <Share2 className="w-4 h-4" />
                  Compartir
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-background border-border">
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-muted"
                  onSelect={() => handleShareSite("whatsapp")}
                >
                  <span className="mr-2 text-base">📱</span>
                  WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-muted"
                  onSelect={() => handleShareSite("telegram")}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Telegram
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-muted"
                  onSelect={() => handleShareSite("email")}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {isAuthenticated && !isLoadingAdmin && isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigation("/admin")}
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
              variant={isAuthenticated ? "outline" : "default"}
              className={
                isAuthenticated
                  ? "text-white border-white/20 hover:bg-white/10 hover:text-white"
                  : ""
              }
            >
              {loginStatus === "logging-in"
                ? "Conectando..."
                : isAuthenticated
                  ? "Cerrar Sesión"
                  : "Iniciar Sesión"}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-white hover:bg-white/10 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10">
            <nav className="flex flex-col space-y-2">
              {isAuthenticated && !isLoadingAdmin && isAdmin && (
                <div className="px-3 py-2">
                  <Badge
                    variant="outline"
                    className="text-xs border-primary/50 text-primary bg-primary/10"
                  >
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

              {/* Share site - mobile */}
              <div className="px-1">
                <p className="text-xs text-white/50 px-3 py-1">
                  Compartir sitio
                </p>
                <Button
                  variant="ghost"
                  onClick={() => {
                    handleShareSite("whatsapp");
                    setMobileMenuOpen(false);
                  }}
                  className="justify-start w-full text-white hover:bg-white/10 hover:text-white"
                >
                  <span className="mr-2 text-base">📱</span>
                  WhatsApp
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    handleShareSite("telegram");
                    setMobileMenuOpen(false);
                  }}
                  className="justify-start w-full text-white hover:bg-white/10 hover:text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Telegram
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    handleShareSite("email");
                    setMobileMenuOpen(false);
                  }}
                  className="justify-start w-full text-white hover:bg-white/10 hover:text-white"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
              </div>

              {isAuthenticated && !isLoadingAdmin && isAdmin && (
                <Button
                  variant="outline"
                  onClick={() => handleNavigation("/admin")}
                  className="justify-start gap-2 text-white border-white/20 hover:bg-white/10 hover:text-white"
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </Button>
              )}
              <Button
                onClick={handleAuth}
                disabled={disabled}
                variant={isAuthenticated ? "outline" : "default"}
                className={
                  isAuthenticated
                    ? "justify-start text-white border-white/20 hover:bg-white/10 hover:text-white"
                    : "justify-start"
                }
              >
                {loginStatus === "logging-in"
                  ? "Conectando..."
                  : isAuthenticated
                    ? "Cerrar Sesión"
                    : "Iniciar Sesión"}
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
