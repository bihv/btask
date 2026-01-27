/**
 * Extract dominant background color from an image
 * Samples from corners where background typically is (like Trello)
 * @param imageUrl - URL of the image
 * @returns Promise<string> - RGB color string (e.g., "rgb(220, 228, 236)")
 */
export async function extractDominantColor(imageUrl: string): Promise<string> {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    resolve('rgb(230, 230, 235)');
                    return;
                }

                // Scale down for faster processing
                const maxSize = 100;
                const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
                canvas.width = Math.max(1, Math.floor(img.width * scale));
                canvas.height = Math.max(1, Math.floor(img.height * scale));

                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                const width = canvas.width;
                const height = canvas.height;

                // Sample from corners (5x5 pixel areas in each corner)
                const cornerSize = Math.max(3, Math.min(5, Math.floor(Math.min(width, height) * 0.1)));
                const samples: { r: number; g: number; b: number }[] = [];

                const getPixel = (x: number, y: number) => {
                    const idx = (y * width + x) * 4;
                    if (data[idx + 3] < 128) return null;
                    return { r: data[idx], g: data[idx + 1], b: data[idx + 2] };
                };

                // Top-left corner
                for (let y = 0; y < cornerSize; y++) {
                    for (let x = 0; x < cornerSize; x++) {
                        const p = getPixel(x, y);
                        if (p) samples.push(p);
                    }
                }

                // Top-right corner
                for (let y = 0; y < cornerSize; y++) {
                    for (let x = width - cornerSize; x < width; x++) {
                        const p = getPixel(x, y);
                        if (p) samples.push(p);
                    }
                }

                // Bottom-left corner
                for (let y = height - cornerSize; y < height; y++) {
                    for (let x = 0; x < cornerSize; x++) {
                        const p = getPixel(x, y);
                        if (p) samples.push(p);
                    }
                }

                // Bottom-right corner
                for (let y = height - cornerSize; y < height; y++) {
                    for (let x = width - cornerSize; x < width; x++) {
                        const p = getPixel(x, y);
                        if (p) samples.push(p);
                    }
                }

                if (samples.length === 0) {
                    resolve('rgb(230, 230, 235)');
                    return;
                }

                // Use median instead of average for more robust result
                const sortByLuminance = (a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }) => {
                    const lumA = 0.299 * a.r + 0.587 * a.g + 0.114 * a.b;
                    const lumB = 0.299 * b.r + 0.587 * b.g + 0.114 * b.b;
                    return lumA - lumB;
                };

                samples.sort(sortByLuminance);

                // Take the lighter samples (upper 50% by luminance - background is usually lighter)
                const lightSamples = samples.slice(Math.floor(samples.length * 0.5));

                if (lightSamples.length === 0) {
                    resolve('rgb(230, 230, 235)');
                    return;
                }

                // Average the light samples
                let r = 0, g = 0, b = 0;
                for (const s of lightSamples) {
                    r += s.r;
                    g += s.g;
                    b += s.b;
                }
                r = Math.round(r / lightSamples.length);
                g = Math.round(g / lightSamples.length);
                b = Math.round(b / lightSamples.length);

                resolve(`rgb(${r}, ${g}, ${b})`);
            } catch (error) {
                resolve('rgb(230, 230, 235)');
            }
        };

        img.onerror = () => {
            resolve('rgb(230, 230, 235)');
        };

        img.src = imageUrl;
    });
}
