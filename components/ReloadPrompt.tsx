import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

const ReloadPrompt: React.FC = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
    onNeedRefresh() {
      console.log('New content available, refresh needed');
    },
    onOfflineReady() {
      console.log('Offline ready');
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-[90vw] max-w-md animate-in slide-in-from-bottom-10 duration-500">
      <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-brand-primary/20 p-2 rounded-xl">
             <RefreshCw size={20} className={`text-brand-secondary ${needRefresh ? 'animate-spin-slow' : ''}`} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white">
              {offlineReady ? 'App ready to work offline' : 'New version available!'}
            </span>
            <span className="text-[10px] text-white/60">
              {offlineReady ? 'Content has been cached for disconnected use.' : 'Reload to get the latest features and fixes.'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {needRefresh && (
            <button
              onClick={() => updateServiceWorker(true)}
              className="bg-brand-primary hover:bg-brand-primary/80 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95"
            >
              Update Now
            </button>
          )}
          <button
            onClick={() => close()}
            className="p-2 text-white/40 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReloadPrompt;
