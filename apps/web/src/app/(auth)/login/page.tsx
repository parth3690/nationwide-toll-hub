/**
 * Elite Login Page Component
 * 
 * Secure authentication page with modern UI, form validation,
 * and social login options.
 */

import { Metadata } from 'next';
import { LoginForm } from '@/components/auth/login-form';
import { AuthLayout } from '@/components/auth/auth-layout';
import { SocialLogin } from '@/components/auth/social-login';

export const metadata: Metadata = {
  title: 'Sign In - Nationwide Toll Hub',
  description: 'Sign in to your Nationwide Toll Hub account to manage your toll payments and view statements.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your account to continue managing your toll payments"
    >
      <div className="space-y-6">
        <LoginForm />
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <SocialLogin />
      </div>
    </AuthLayout>
  );
}
