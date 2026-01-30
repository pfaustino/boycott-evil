import React, { useState } from 'react';
import CameraScanner from './CameraScanner';

interface Props {
    onSearch: (code: string) => void;
    isLoading: boolean;
}

export default function BarcodeSearch({ onSearch, isLoading }: Props) {
    const [code, setCode] = useState('');
    const [showScanner, setShowScanner] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (code.trim()) {
            onSearch(code.trim());
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md mx-auto">
            <div>
                <label htmlFor="barcode" className="block text-sm font-medium text-slate-700 mb-2">
                    Enter Barcode or Scan
                </label>
                {/* Input row */}
                <div className="flex gap-2 mb-3">
                    <input
                        id="barcode"
                        type="text"
                        inputMode="numeric"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="e.g. 012345678901"
                        className="flex-1 min-w-0 p-3 text-base border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                    />
                    <button
                        type="button"
                        onClick={() => setShowScanner(true)}
                        className="bg-slate-100 text-slate-600 px-3 sm:px-4 py-3 rounded-lg font-semibold hover:bg-slate-200 active:bg-slate-300 transition-colors border border-slate-200 shrink-0 text-xl"
                        title="Scan with Camera"
                        aria-label="Open camera scanner"
                    >
                        📷
                    </button>
                </div>
                {/* Check button - full width for easy tapping on mobile */}
                <button
                    type="submit"
                    disabled={isLoading || !code}
                    className="w-full bg-indigo-600 text-white px-6 py-4 rounded-lg font-semibold text-lg hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                    {isLoading ? 'Checking...' : 'Check Product'}
                </button>
            </div>

            {/* Scanner Modal */}
            {showScanner && (
                <CameraScanner
                    onScanSuccess={(scannedCode) => {
                        setCode(scannedCode);
                        setShowScanner(false);
                        onSearch(scannedCode);
                    }}
                    onClose={() => setShowScanner(false)}
                />
            )}
        </form>
    );
}
