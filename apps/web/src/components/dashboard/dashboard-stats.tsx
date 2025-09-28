/**
 * Elite Dashboard Stats Component
 * 
 * Comprehensive statistics display with real-time data,
 * trend indicators, and interactive charts.
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, DollarSign, CreditCard, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface DashboardStatsProps {
  className?: string;
}

interface StatCard {
  title: string;
  value: string;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  trend?: 'up' | 'down' | 'stable';
}

export function DashboardStats({ className }: DashboardStatsProps) {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats');
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (error) {
    return (
      <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">--</div>
              <p className="text-xs text-muted-foreground">Failed to load data</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards: StatCard[] = [
    {
      title: 'Total Spent',
      value: stats?.totalSpent || '$0.00',
      change: stats?.totalSpentChange || 0,
      changeType: stats?.totalSpentChange > 0 ? 'increase' : stats?.totalSpentChange < 0 ? 'decrease' : 'neutral',
      icon: DollarSign,
      description: 'This month',
      trend: stats?.totalSpentTrend,
    },
    {
      title: 'Active Payments',
      value: stats?.activePayments?.toString() || '0',
      change: stats?.activePaymentsChange || 0,
      changeType: stats?.activePaymentsChange > 0 ? 'increase' : stats?.activePaymentsChange < 0 ? 'decrease' : 'neutral',
      icon: CreditCard,
      description: 'Pending transactions',
      trend: stats?.activePaymentsTrend,
    },
    {
      title: 'Overdue Amount',
      value: stats?.overdueAmount || '$0.00',
      change: stats?.overdueAmountChange || 0,
      changeType: stats?.overdueAmountChange > 0 ? 'increase' : stats?.overdueAmountChange < 0 ? 'decrease' : 'neutral',
      icon: AlertTriangle,
      description: 'Requires attention',
      trend: stats?.overdueAmountTrend,
    },
    {
      title: 'Successful Payments',
      value: `${stats?.successfulPayments || 0}%`,
      change: stats?.successfulPaymentsChange || 0,
      changeType: stats?.successfulPaymentsChange > 0 ? 'increase' : stats?.successfulPaymentsChange < 0 ? 'decrease' : 'neutral',
      icon: CheckCircle,
      description: 'Payment success rate',
      trend: stats?.successfulPaymentsTrend,
    },
  ];

  if (isLoading) {
    return (
      <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[120px] mb-2" />
              <Skeleton className="h-3 w-[80px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        const isPositive = stat.changeType === 'increase';
        const isNegative = stat.changeType === 'decrease';
        
        return (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  {stat.change !== 0 && (
                    <>
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3 text-green-600" />
                      ) : isNegative ? (
                        <TrendingDown className="h-3 w-3 text-red-600" />
                      ) : null}
                      <span
                        className={cn(
                          'font-medium',
                          isPositive && 'text-green-600',
                          isNegative && 'text-red-600'
                        )}
                      >
                        {Math.abs(stat.change)}%
                      </span>
                    </>
                  )}
                </div>
                <span>{stat.description}</span>
              </div>
              
              {stat.title === 'Overdue Amount' && parseFloat(stat.value.replace('$', '')) > 0 && (
                <Badge variant="destructive" className="mt-2">
                  Action Required
                </Badge>
              )}
              
              {stat.title === 'Successful Payments' && parseInt(stat.value) < 95 && (
                <Badge variant="warning" className="mt-2">
                  Below Target
                </Badge>
              )}
            </CardContent>
            
            {/* Trend indicator */}
            {stat.trend && (
              <div
                className={cn(
                  'absolute bottom-0 left-0 right-0 h-1',
                  stat.trend === 'up' && 'bg-green-500',
                  stat.trend === 'down' && 'bg-red-500',
                  stat.trend === 'stable' && 'bg-blue-500'
                )}
              />
            )}
          </Card>
        );
      })}
    </div>
  );
}
