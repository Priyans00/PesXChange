"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User } from '@supabase/supabase-js';
import {
  ShoppingBag,
  Plus,
  MessageCircle,
  Menu,
  X,
  Home,
  Heart,
  UserIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();

    // Get initial user - handle missing session gracefully
    supabase.auth.getUser().then(({ data, error }) => {
      if (error) {
        // Don't log "Auth session missing!" as an error - it's normal
        if (error.message !== "Auth session missing!") {
          console.error("Error fetching user:", error.message);
        }
        setUser(null);
      } else {
        setUser(data.user);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
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
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-black dark:text-white" />
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
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActivePath(href)
                    ? 'bg-black dark:bg-white text-white dark:text-black'
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

            {/* User Menu */}
            {loading ? (
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            ) : user ? (
              <div className="flex items-center space-x-3">
                <div className="hidden md:flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {user.email?.split('@')[0]}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="hidden md:flex"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/auth/sign-up">Sign Up</Link>
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col space-y-2">
              {navItems.map(({ href, label, icon: Icon, onClick }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={(e) => {
                    onClick?.(e);
                    setIsMenuOpen(false);
                  }}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActivePath(href)
                      ? 'bg-black dark:bg-white text-white dark:text-black'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Link>
              ))}

              {user && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2 px-3 py-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {user.email?.split('@')[0]}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSignOut}
                    className="w-full mt-2"
                  >
                    Sign Out
                  </Button>
                </div>
              )}

              {!user && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  <Button variant="ghost" size="sm" className="w-full" asChild>
                    <Link href="/auth/login" onClick={() => setIsMenuOpen(false)}>
                      Sign In
                    </Link>
                  </Button>
                  <Button size="sm" className="w-full" asChild>
                    <Link href="/auth/sign-up" onClick={() => setIsMenuOpen(false)}>
                      Sign Up
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </nav>
  );
}
