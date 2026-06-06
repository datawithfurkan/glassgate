/**
 * Estimate token counts for text content.
 * Uses a simple approximation: ~4 chars per token (English average).
 */

export function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

export function compareTokens(htmlString, markdownString) {
  const htmlEstimate = estimateTokens(htmlString);
  const markdownEstimate = estimateTokens(markdownString);
  const savings = htmlEstimate > 0
    ? Math.round(((htmlEstimate - markdownEstimate) / htmlEstimate) * 100)
    : 0;

  return {
    htmlEstimate,
    markdownEstimate,
    estimatedSavingsPercent: Math.max(0, savings),
  };
}
