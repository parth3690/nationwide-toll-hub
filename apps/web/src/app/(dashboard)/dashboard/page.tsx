/**
 * Elite Dashboard Page Component
 * 
 * Comprehensive dashboard with toll statistics, recent activity,
 * charts, and quick actions for the web application.
 */

import { Metadata } from 'next';
import { Suspense } from 'react';
import { DashboardStats } from '@/components/dashboard/dashboard-stats';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { TollChart } from '@/components/dashboard/toll-chart';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { UpcomingPayments } from '@/components/dashboard/upcoming-payments';
import { VehicleOverview } from '@/components/dashboard/vehicle-overview';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Dashboard - Nationwide Toll Hub',
  description: 'Overview of your toll payments, recent activity, and account statistics.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your toll account.
        </p>
      </div>

      {/* Stats Grid */}
      <Suspense fallback={<LoadingSpinner />}>
        <DashboardStats />
      </Suspense>

      {/* Charts and Analytics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Toll Usage Trends</CardTitle>
            <CardDescription>
              Your toll spending over the last 12 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<LoadingSpinner />}>
              <TollChart />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vehicle Overview</CardTitle>
            <CardDescription>
              Tolls by vehicle and agency breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<LoadingSpinner />}>
              <VehicleOverview />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your latest toll events and payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<LoadingSpinner />}>
                <RecentActivity />
              </Suspense>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuickActions />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Payments</CardTitle>
              <CardDescription>
                Pending toll payments and due dates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<LoadingSpinner />}>
                <UpcomingPayments />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
