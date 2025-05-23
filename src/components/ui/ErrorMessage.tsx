import React from 'react';
import { Card, CardContent } from './card';
import { AlertTriangle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/utils/cn';

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'fatal';

export interface ErrorMessageProps {
  message: string;
  details?: string;
  severity?: ErrorSeverity;
  onRetry?: () => void;
  className?: string;
}

/**
 * ErrorMessage component displays error messages with customizable severity levels and retry actions.
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  details,
  severity = 'error',
  onRetry,
  className,
}) => {
  const severityConfig = {
    info: {
      icon: AlertCircle,
      bgColor: 'bg-blue-900/10',
      borderColor: 'border-blue-800',
      textColor: 'text-blue-400',
      buttonColor: 'border-blue-600 text-blue-400 hover:bg-blue-900/20',
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-900/10',
      borderColor: 'border-yellow-800',
      textColor: 'text-yellow-400',
      buttonColor: 'border-yellow-600 text-yellow-400 hover:bg-yellow-900/20',
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-900/10',
      borderColor: 'border-red-800',
      textColor: 'text-red-400',
      buttonColor: 'border-red-600 text-red-400 hover:bg-red-900/20',
    },
    fatal: {
      icon: XCircle,
      bgColor: 'bg-red-900/20',
      borderColor: 'border-red-700',
      textColor: 'text-red-500',
      buttonColor: 'border-red-500 text-red-500 hover:bg-red-900/20',
    },
  };

  const { icon: Icon, bgColor, borderColor, textColor, buttonColor } = severityConfig[severity];

  return (
    <Card className={cn(bgColor, borderColor, 'my-4', className)}>
      <CardContent className="pt-6 flex flex-col items-center text-center">
        <Icon className={cn('h-10 w-10 mb-4', textColor)} />
        <h3 className="text-lg font-semibold text-white mb-2">{message}</h3>
        {details && <p className="text-gray-400 text-sm mb-4">{details}</p>}
        {onRetry && (
          <Button 
            variant="outline" 
            onClick={onRetry}
            className={cn('mt-2 flex items-center gap-2', buttonColor)}
          >
            <RefreshCw className="h-4 w-4" /> Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}; 