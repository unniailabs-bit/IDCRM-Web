import { Download, X } from 'lucide-react';
import { Button } from '../ui/button';

interface InstallPromptProps {
  onInstall: () => void;
  onDismiss: () => void;
}

export function InstallPrompt({ onInstall, onDismiss }: InstallPromptProps) {
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 z-50 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Download className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm mb-1">Install CRM Admin App</h3>
          <p className="text-xs text-gray-600 mb-3">
            Install this app on your device for quick access and offline functionality.
          </p>
          <div className="flex gap-2">
            <Button onClick={onInstall} size="sm" className="flex-1">
              Install
            </Button>
            <Button onClick={onDismiss} variant="outline" size="sm">
              Later
            </Button>
          </div>
        </div>
        <button onClick={onDismiss} className="p-1 hover:bg-gray-100 rounded" aria-label="Dismiss">
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
}
