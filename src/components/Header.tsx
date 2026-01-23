import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/NotificationBell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Menu, 
  LogOut, 
  User, 
  LayoutDashboard,
  UtensilsCrossed,
} from 'lucide-react';
import { useState } from 'react';

export const Header = () => {
  const { isAuthenticated, profile, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    switch (role) {
      case 'donor': return '/donor/dashboard';
      case 'ngo': return '/ngo/explore';
      case 'admin': return '/admin/dashboard';
      default: return '/';
    }
  };

  const getNavLinks = () => {
    switch (role) {
      case 'donor':
        return [
          { label: 'Dashboard', href: '/donor/dashboard' },
          { label: 'Create Listing', href: '/donor/create-listing' },
        ];
      case 'ngo':
        return [
          { label: 'Explore', href: '/ngo/explore' },
          { label: 'Map View', href: '/ngo/map' },
          { label: 'My Requests', href: '/ngo/requests' },
        ];
      case 'admin':
        return [
          { label: 'Dashboard', href: '/admin/dashboard' },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-orange-400 shadow-sm">
            <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold gradient-text">Share Plate</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {isAuthenticated && navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === link.href ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <NotificationBell />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.name} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {profile?.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{profile?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {profile?.org_name}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(getDashboardLink())}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] sm:w-[350px]">
                  <nav className="flex flex-col gap-4 mt-8">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        onClick={() => setMobileOpen(false)}
                        className={`text-lg font-medium transition-colors hover:text-primary p-2 rounded-lg ${
                          location.pathname === link.href 
                            ? 'text-primary bg-primary/5' 
                            : 'text-muted-foreground'
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                    <Button variant="outline" onClick={handleLogout} className="mt-4">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </nav>
                </SheetContent>
              </Sheet>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Login
              </Button>
              <Button onClick={() => navigate('/register')}>
                Get Started
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
