import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  variant?: 'default' | 'indigo' | 'orange' | 'violet';
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  variant = 'default',
}: MetricCardProps) {
  const getGradientClass = () => {
    if (variant === 'indigo') {
      return 'from-indigo-200 via-indigo-600 to-indigo-600 shadow-indigo-500/25';
    }
    if (variant === 'orange') {
      return 'from-orange-200 via-orange-600 to-orange-600 shadow-orange-500/25';
    }
    if (variant === 'violet') {
      return 'from-violet-200 via-violet-600 to-violet-600 shadow-violet-500/25';
    }
    return 'from-green-200 via-green-600 to-green-600 shadow-green-500/25';
  };

  return (
    <Card className="group relative overflow-hidden border-0 shadow-soft hover:shadow-glow transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-indigo-50/0 group-hover:from-blue-50/50 group-hover:to-indigo-50/30 transition-all duration-300"></div>

      <CardContent className="p-6 relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium text-gray-600 group-hover:text-gray-700 transition-colors">
              {title}
            </p>
            <p className="text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
              {value}
            </p>
            {trend && (
              <div className="flex items-center gap-1.5 pt-1">
                <div
                  className={`flex items-center gap-1 text-xs font-medium ${
                    trendUp ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {trendUp ? (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                      />
                    </svg>
                  )}
                  <span>{trend}</span>
                </div>
              </div>
            )}
          </div>
          <div
            className={`w-14 h-14 bg-gradient-to-br 
              ${getGradientClass()} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:shadow-gray-500/40 group-hover:scale-110 transition-all duration-300`}
          >
            <Icon className="w-7 h-7 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
