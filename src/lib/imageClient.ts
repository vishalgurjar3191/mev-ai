/**
 * Pollinations.ai is a free, keyless image generation API — good fit for MEV AI's free tier.
 * It works by GET request to an image URL built from the prompt; the image itself is the response.
 */
export function buildImageUrl(prompt: string, seed: number, width = 1024, height = 1024): string {
  const encoded = encodeURIComponent(prompt.trim());
  return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&seed=${seed}&nologo=true`;
}

export async function downloadImage(url: string, filename: string): Promise<void> {
  const response = await fetch(url);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objectUrl);
}
