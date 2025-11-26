import Fuse from 'fuse.js';

export interface ImageFile {
  fileName: string;
  url: string;
  sha256?: string;
}

export interface StagedItemForMatching {
  providerSku: string;
  name: string;
  model?: string;
  brand?: string;
}

export interface ImageMatch {
  providerSku: string;
  fileName: string;
  url: string;
  score: number;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Fuzzy match images to staged items using Fuse.js
 * 
 * @param stagedItems - Array of staged items to match
 * @param imageFiles - Array of uploaded image files
 * @param threshold - Match threshold (0-1, lower is stricter)
 * @returns Array of matches with confidence scores
 */
export function fuzzyMatchImages(
  stagedItems: StagedItemForMatching[],
  imageFiles: ImageFile[],
  threshold: number = 0.4
): ImageMatch[] {
  if (stagedItems.length === 0 || imageFiles.length === 0) {
    return [];
  }

  const matches: ImageMatch[] = [];

  // Create searchable strings for each staged item
  const searchableItems = stagedItems.map((item) => ({
    ...item,
    searchText: [
      item.name,
      item.model,
      item.brand,
      item.providerSku,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase(),
  }));

  // Create Fuse instance for staged items
  const fuse = new Fuse(searchableItems, {
    keys: ['searchText', 'name', 'model', 'brand', 'providerSku'],
    threshold: threshold,
    includeScore: true,
    minMatchCharLength: 3,
  });

  // For each image file, find the best matching staged item
  for (const imageFile of imageFiles) {
    const fileName = imageFile.fileName.toLowerCase();
    
    // Remove file extension for matching
    const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    
    // Search for matches
    const results = fuse.search(fileNameWithoutExt);

    if (results.length > 0) {
      const bestMatch = results[0];
      const score = bestMatch.score ?? 1;
      
      // Determine confidence level
      let confidence: 'high' | 'medium' | 'low';
      if (score < 0.2) {
        confidence = 'high';
      } else if (score < 0.4) {
        confidence = 'medium';
      } else {
        confidence = 'low';
      }

      matches.push({
        providerSku: bestMatch.item.providerSku,
        fileName: imageFile.fileName,
        url: imageFile.url,
        score: score,
        confidence: confidence,
      });
    }
  }

  // Sort by score (best matches first)
  matches.sort((a, b) => a.score - b.score);

  return matches;
}

/**
 * Get suggested matches for a specific provider SKU
 */
export function getSuggestedMatchesForSku(
  providerSku: string,
  imageFiles: ImageFile[],
  stagedItems: StagedItemForMatching[]
): ImageFile[] {
  const item = stagedItems.find((i) => i.providerSku === providerSku);
  if (!item) {
    return [];
  }

  const searchText = [
    item.name,
    item.model,
    item.brand,
    item.providerSku,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const fuse = new Fuse(imageFiles, {
    keys: ['fileName'],
    threshold: 0.4,
    includeScore: true,
  });

  const results = fuse.search(searchText);
  return results
    .filter((r) => (r.score ?? 1) < 0.5)
    .map((r) => r.item);
}

