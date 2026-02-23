import React, { useEffect, useRef, useState } from 'react';

interface IsolatedLogoProps {
    src: string;
    alt: string;
    className?: string;
    threshold?: number; // 0-255: pixels darker than this will be transparent
    boostDetail?: boolean;
}

/**
 * IsolatedLogo: A high-performance component that programmatically removes
 * background noise from images via HTML5 Canvas. Precision-engineered for
 * CRM.OFICIAL's high-authority branding.
 */
const IsolatedLogo: React.FC<IsolatedLogoProps> = ({
    src,
    alt,
    className,
    threshold = 30,
    boostDetail = true
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const img = new Image();
        img.src = src;
        img.crossOrigin = "anonymous";

        img.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return;

            // Set canvas dimensions to match image
            canvas.width = img.width;
            canvas.height = img.height;

            // Draw original image
            ctx.drawImage(img, 0, 0);

            // Get image data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Process pixels: Precision Background Removal
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                // Calculate luminance (perceptual weight)
                const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

                if (luminance < threshold) {
                    // Pure Transparency for background artifacts
                    data[i + 3] = 0;
                } else if (boostDetail) {
                    // Boost internal white/light pixels to peak brilliance
                    // This preserves the circuitry detail and text clarity
                    const factor = 255 / Math.max(r, g, b, 1);
                    data[i] = Math.min(255, r * factor);
                    data[i + 1] = Math.min(255, g * factor);
                    data[i + 2] = Math.min(255, b * factor);
                }
            }

            // Put back the cleaned data
            ctx.putImageData(imageData, 0, 0);
            setIsLoaded(true);
        };
    }, [src, threshold, boostDetail]);

    return (
        <div className={`relative ${className}`}>
            <canvas
                ref={canvasRef}
                className={`w-full h-full object-contain ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-700`}
                aria-label={alt}
            />
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            )}
        </div>
    );
};

export default IsolatedLogo;
