/**
 * Elite Mobile Navigation Component
 * 
 * Responsive mobile navigation with hamburger menu,
 * touch-friendly interactions, and smooth animations.
 */

'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X, Bell, User, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

interface MobileNavigationProps {
  className?: string;
}

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: 'Dashboard' },
  { name: 'Tolls', href: '/tolls', icon: 'Toll' },
  { name: 'Statements', href: '/statements', icon: 'Statement' },
  { name: 'Payments', href: '/payments', icon: 'Payment' },
  { name: 'Profile', href: '/profile', icon: 'User' },
];

export function MobileNavigation({ className }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className={cn('lg:hidden', className)}>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="relative p-2"
            aria-label="Open navigation menu"
          >
            {isOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </SheetTrigger>
        
        <SheetContent side="left" className="w-80 p-0">
          <div className="flex flex-col h-full">
            {/* Header */}
            <SheetHeader className="p-6 pb-4">
              <SheetTitle className="text-left text-xl font-bold">
                Nationwide Toll Hub
              </SheetTitle>
            </SheetHeader>

            {/* User Profile Section */}
            <div className="px-6 pb-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.profileImage} alt={user?.name} />
                  <AvatarFallback>
                    {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-4 w-4" />
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
                  >
                    3
                  </Badge>
                </Button>
              </div>
            </div>

            <Separator />

            {/* Navigation Items */}
            <nav className="flex-1 px-6 py-4 space-y-2">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Button
                    key={item.name}
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start text-left',
                      isActive && 'bg-secondary text-secondary-foreground'
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    <span className="text-sm font-medium">{item.name}</span>
                  </Button>
                );
              })}
            </nav>

            <Separator />

            {/* Footer Actions */}
            <div className="p-6 space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
