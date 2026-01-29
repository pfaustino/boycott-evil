import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface Props {
    onScanSuccess: (decodedText: string) => void;
    onScanFailure?: (error: any) => void;
    onClose: () => void;
}

export default function CameraScanner({ onScanSuccess, onScanFailure, onClose }: Props) {
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);

    useEffect(() => {
        // 1. Create instance
        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        const startCamera = async () => {
            try {
                await html5QrCode.start(
                    { facingMode: "user" }, // Default to user/webcam for desktops
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0
                    },
                    (decodedText) => {
                        // Success
                        // Stop scanning immediately to prevent duplicate reads
                        html5QrCode.stop().then(() => {
                            onScanSuccess(decodedText);
                        }).catch(err => console.error("Failed to stop", err));
                    },
                    (errorMessage) => {
                        // Ignore frame parse errors
                        if (onScanFailure) onScanFailure(errorMessage);
                    }
                );
            } catch (err) {
                console.error("Error starting camera", err);
                setError("Could not start camera. Please ensure permissions are granted and you are on a secure context (HTTPS/localhost).");
            }
        };

        // Small delay to ensure DOM is ready
        const timer = setTimeout(startCamera, 100);

        // Cleanup
        return () => {
            clearTimeout(timer);
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(e => console.error("Failed to stop on unmount", e));
            }
        };
    }, []); // Empty dependency array -> run once

    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex flex-col items-center justify-center p-4">
            <div className="bg-white rounded-xl overflow-hidden w-full max-w-md shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 z-10 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
                >
                    ✕
                </button>

                <div className="p-4 bg-slate-900 text-white text-center font-medium">
                    Scan Product Barcode
                </div>

                <div className="relative bg-black min-h-[300px]">
                    <div id="reader" className="w-full h-full"></div>
                </div>

                {error && (
                    <div className="p-4 text-red-600 text-center text-sm font-semibold">
                        {error}
                    </div>
                )}

                <div className="p-4 text-slate-500 text-center text-xs">
                    Hold camera <b>6 inches (15cm)</b> away.<br />
                    Avoid shadows and glare.
                </div>
            </div>
        </div>
    );
}
