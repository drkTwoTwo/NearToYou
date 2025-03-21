
import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, Check, RefreshCw } from 'lucide-react';

type ConnectionStatusType = 'connected' | 'connecting' | 'disconnected';

interface ConnectionStatusProps {
  status: ConnectionStatusType;
  onReconnect?: () => void;
  className?: string;
  error?: Error | null;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  status,
  onReconnect,
  className,
  error
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'connecting':
        return <RefreshCw className="h-4 w-4 text-amber-500 animate-spin" />;
      case 'disconnected':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Connected to server';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-50 border-green-100 text-green-700';
      case 'connecting':
        return 'bg-amber-50 border-amber-100 text-amber-700';
      case 'disconnected':
        return 'bg-red-50 border-red-100 text-red-700';
    }
  };

  return (
    <div className={cn(
      "rounded-lg border px-3 py-2 transition-all duration-300 ease-in-out",
      getStatusColor(),
      className
    )}>
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className="text-sm font-medium">{getStatusText()}</span>
        
        {status === 'disconnected' && onReconnect && (
          <button 
            onClick={onReconnect}
            className="ml-auto text-xs bg-white hover:bg-gray-50 text-gray-600 py-1 px-2 rounded border border-gray-200 transition-colors duration-200"
          >
            Reconnect
          </button>
        )}
      </div>
      
      {status === 'disconnected' && error && (
        <p className="text-xs mt-1 text-red-600">{error.message}</p>
      )}
    </div>
  );
};

export default ConnectionStatus;
