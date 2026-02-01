import { useState } from 'react';
import { track } from '@vercel/analytics';

interface Props {
  onClose: () => void;
}

export default function ShareModal({ onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const appUrl = window.location.origin;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      track('share_link_copied', { url: appUrl });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShareNative = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: 'Boycott Evil - Check Products Before You Buy',
          text: 'Scan product barcodes to see if companies are on boycott lists (ICE, Trump donors, anti-DEI, etc.)',
          url: appUrl,
        });
        track('share_native', { platform: 'native' });
      } catch (err) {
        // User cancelled or error
        console.log('Share cancelled');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50">
          <h2 className="text-xl font-bold text-slate-800">Share Boycott Evil</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 hover:bg-white rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-slate-700 mb-4">
              Help others vote with their wallet! Share this app so people can check products before they buy.
            </p>
            
            {/* QR Code */}
            <div className="bg-white border-2 border-slate-200 rounded-lg p-4 inline-block mb-4">
              <img 
                src="/qr-code.png" 
                alt="QR Code to share Boycott Evil"
                className="w-48 h-48 mx-auto"
                onError={(e) => {
                  // Fallback if QR code not found
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = '<div class="text-slate-400 text-sm p-8">QR Code not found<br>Use share buttons below</div>';
                  }
                }}
              />
            </div>
            
            <p className="text-sm text-slate-500 mb-4">
              Scan with your phone camera
            </p>
          </div>

          {/* Share Options */}
          <div className="space-y-3">
            {/* Native Share (mobile) */}
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                onClick={handleShareNative}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <span>📤</span>
                Share via...
              </button>
            )}

            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className={`w-full py-3 px-4 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${
                copied
                  ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {copied ? (
                <>
                  <span>✓</span>
                  Link Copied!
                </>
              ) : (
                <>
                  <span>🔗</span>
                  Copy Link
                </>
              )}
            </button>

            {/* URL Display */}
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-500 mb-1">App URL:</p>
              <p className="text-sm text-slate-700 font-mono break-all">{appUrl}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-center">
          <p className="text-xs text-slate-500">
            Spread the word! Help others make ethical shopping choices.
          </p>
        </div>
      </div>
    </div>
  );
}
