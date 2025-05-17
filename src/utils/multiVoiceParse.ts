
import { VoiceProduct } from '@/types/voice';

// Export MultiProduct as an alias for VoiceProduct for backward compatibility
export type MultiProduct = VoiceProduct;

// Parse multi-product commands from voice input
export function parseMultiProductCommand(
  command: string,
  productList: { name: string }[] = []
): VoiceProduct[] {
  // Implementation uses parseMultipleProducts from voiceCommandUtils
  // This is just a wrapper for backward compatibility
  
  // Clean up the command and remove leading action words
  const cleanedCommand = command.replace(/^(add|create|insert|put|place)\s+/i, '').trim();
  
  // Split by common delimiters for multiple products
  const productSegments = cleanedCommand.split(/\s*,\s*|\s+and\s+|\s+plus\s+|\s+also\s+|\s+with\s+/i);
  
  const results: VoiceProduct[] = [];
  
  productSegments.forEach(segment => {
    const trimmedSegment = segment.trim();
    if (!trimmedSegment) return;
    
    // Simple parsing for demo purposes
    let quantity = 1;
    let unit = 'piece';
    
    // Look for quantity patterns like "5kg" or "3 packets"
    const qtyMatch = trimmedSegment.match(/^(\d+)\s*([a-z]+)/i);
    if (qtyMatch) {
      quantity = parseInt(qtyMatch[1], 10);
      unit = qtyMatch[2].toLowerCase();
      
      // Use the rest as product name
      const productName = trimmedSegment.replace(/^\d+\s*[a-z]+\s+/i, '');
      
      results.push({
        name: productName,
        quantity,
        unit,
        position: 'unspecified',
        image_url: ''
      });
    } else {
      // If no quantity pattern, use the whole segment as product name
      results.push({
        name: trimmedSegment,
        quantity: 1,
        unit: 'piece',
        position: 'unspecified',
        image_url: ''
      });
    }
  });
  
  return results;
}
