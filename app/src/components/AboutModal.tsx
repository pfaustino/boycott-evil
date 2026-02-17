import { useState } from 'react';

interface Props {
  onClose: () => void;
}

export default function AboutModal({ onClose }: Props) {
  const appUrl = window.location.origin;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50">
          <h2 className="text-xl font-bold text-slate-800">About Boycott Evil</h2>
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
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-2">
              Boycott Evil
            </h3>
            <p className="text-slate-600 mb-4">
              Scan product barcodes to see if companies are on boycott lists (ICE, Trump donors, anti-DEI, etc.)
            </p>
            
            {/* QR Code */}
            <div className="bg-white border-2 border-slate-200 rounded-lg p-4 inline-block mb-4">
              <img 
                src="/qr-code.png" 
                alt="QR Code for Boycott Evil"
                className="w-48 h-48 mx-auto"
                onError={(e) => {
                  // Fallback if QR code not found
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = '<div class="text-slate-400 text-sm p-8">QR Code not found</div>';
                  }
                }}
              />
            </div>
            
            <p className="text-sm text-slate-500 mb-6">
              Scan with your phone camera to visit the app
            </p>
          </div>

          {/* App Info */}
          <div className="space-y-4 text-sm text-slate-700">
            <div>
              <h4 className="font-semibold text-slate-800 mb-2">What is Boycott Evil?</h4>
              <p className="text-slate-600">
                A tool to help you make ethical shopping choices by checking if products are made by companies on boycott lists.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 mb-2">Data Sources</h4>
              <p className="text-slate-600">
                Powered by Open Facts (Food, Beauty, Pet, Products) & Community Data
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 mb-2">App URL</h4>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Visit us at:</p>
                <p className="text-sm text-slate-700 font-mono break-all">{appUrl}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-center">
          <p className="text-xs text-slate-500">
            Vote with your wallet. Know before you buy.
          </p>
        </div>
      </div>
    </div>
  );
}
