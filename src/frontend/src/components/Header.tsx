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
import { Mail, Menu, Share2, Shield, X } from "lucide-react";
import { useEffect, useState } from "react";
import logoSrc from "../../public/assets/Logo-4.png";
// Import og-logo-preview to ensure it is included in the build bundle
import ogPreviewSrc from "../../public/assets/generated/og-logo-preview.dim_1200x630.png";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useIsCallerAdmin } from "../hooks/useQueries";

// Export so other modules can reference the og:image path
export const OG_IMAGE_URL = `https://mectelliottwave.com${ogPreviewSrc}`;

const SITE_URL = "https://mectelliottwave.com";
const SITE_TITLE =
  "MECT EW - An\u00e1lisis T\u00e9cnico de Mercados Financieros";

function WhatsAppIcon() {
  return (
    <svg
      role="img"
      aria-label="WhatsApp"
      className="w-4 h-4 mr-2 flex-shrink-0"
      viewBox="0 0 24 24"
      fill="#25D366"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg
      role="img"
      aria-label="Telegram"
      className="w-4 h-4 mr-2 flex-shrink-0"
      viewBox="0 0 24 24"
      fill="#26A5E4"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

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
    { path: "/sobre-mi", label: "Sobre M\u00ed" },
    { path: "/analisis", label: "An\u00e1lisis" },
    { path: "/consultorias", label: "Consultor\u00edas" },
    { path: "/mentorias", label: "Mentor\u00edas" },
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
                  <WhatsAppIcon />
                  WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-muted"
                  onSelect={() => handleShareSite("telegram")}
                >
                  <TelegramIcon />
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
                  ? "Cerrar Sesi\u00f3n"
                  : "Iniciar Sesi\u00f3n"}
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
                  <WhatsAppIcon />
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
                  <TelegramIcon />
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
                    ? "Cerrar Sesi\u00f3n"
                    : "Iniciar Sesi\u00f3n"}
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
