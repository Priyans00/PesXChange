"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { 
  ShoppingBag, 
  Plus, 
  MessageCircle, 
  Menu,
  X,
  Home,
  Heart,
  UserIcon,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { useAuth } from "@/contexts/auth-context";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();

  const handleSignOut = async () => {
    logout();
    router.push('/');
  };

  const isActivePath = (path: string) => {
    return pathname === path;
  };

  const handleSellClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      // Store the intended destination in sessionStorage
      sessionStorage.setItem('redirectAfterLogin', '/sell');
      router.push('/auth/login');
    }
  };

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/item-listing", label: "Browse", icon: ShoppingBag },
    { href: "/sell", label: "Sell", icon: Plus, onClick: handleSellClick },
    ...(user ? [
      { href: "/chat", label: "Messages", icon: MessageCircle },
      { href: "/favorites", label: "Favorites", icon: Heart },
      { href: "/profile", label: "Profile", icon: UserIcon },
    ] : [])
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
              PesXChange
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map(({ href, label, icon: Icon, onClick }) => (
              <Link
                key={href}
                href={href}
                onClick={onClick}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActivePath(href)
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Theme Switcher */}
            <ThemeSwitcher />

            {/* Auth Section */}
            <div className="hidden md:flex items-center space-x-4">
              {isLoading ? (
                <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
              ) : user ? (
                <div className="flex items-center space-x-3">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {user.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {user.profile.campus} Campus • {user.profile.branch}
                    </span>
                  </div>
                  <Button
                    onClick={handleSignOut}
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => router.push('/auth/login')}
                    variant="ghost"
                    size="sm"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => router.push('/auth/sign-up')}
                    size="sm"
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                variant="ghost"
                size="sm"
                className="p-2"
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-800">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map(({ href, label, icon: Icon, onClick }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={(e) => {
                    setIsMenuOpen(false);
                    onClick?.(e);
                  }}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                    isActivePath(href)
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </Link>
              ))}

              {/* Mobile Auth Section */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800 mt-4">
                {isLoading ? (
                  <div className="px-3 py-2 text-gray-600 dark:text-gray-400">
                    Loading...
                  </div>
                ) : user ? (
                  <div className="px-3 py-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {user.profile.campus} Campus • {user.profile.branch}
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          setIsMenuOpen(false);
                          handleSignOut();
                        }}
                        variant="ghost"
                        size="sm"
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button
                      onClick={() => {
                        setIsMenuOpen(false);
                        router.push('/auth/login');
                      }}
                      variant="ghost"
                      className="w-full justify-start px-3"
                    >
                      Sign In
                    </Button>
                    <Button
                      onClick={() => {
                        setIsMenuOpen(false);
                        router.push('/auth/sign-up');
                      }}
                      className="w-full justify-start px-3"
                    >
                      Sign Up
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
