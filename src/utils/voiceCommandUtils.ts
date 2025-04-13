
// Add this function near the end of the file, before the updateProductDetails function
const extractProductDetailsFromEntities = (entities: any[]): Partial<ProductDetails> => {
  const details: Partial<ProductDetails> = {
    name: '',
  };
  
  if (entities) {
    for (const entity of entities) {
      switch (entity.label) {
        case 'PRODUCT':
          details.name = entity.text;
          break;
        case 'QUANTITY':
          details.quantity = parseFloat(entity.text);
          break;
        case 'UNIT':
          details.unit = entity.text.toLowerCase();
          break;
        case 'POSITION':
        case 'LOCATION':
          // Extract just the number from position entities like "rack 3"
          const positionMatch = entity.text.match(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/i);
          if (positionMatch) {
            // Convert number words to digits if needed
            const numberWords: Record<string, string> = {
              'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
              'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10'
            };
            
            const positionNumber = numberWords[positionMatch[1].toLowerCase()] || positionMatch[1];
            details.position = positionNumber;
          } else {
            details.position = entity.text;
          }
          break;
        case 'PRICE':
          details.price = parseFloat(entity.text.replace(/[₹$]/g, ''));
          break;
        case 'DATE':
        case 'EXPIRY':
          details.expiry = entity.text;
          break;
      }
    }
  }
  
  return details;
};

/**
 * Update existing product details with new information from voice command
 */
export const updateProductDetails = async (
  existingDetails: ProductDetails, 
  command: string
): Promise<ProductDetails> => {
  // Process the new command to extract entities
  const result = await processText(command);
  const newDetails = extractProductDetailsFromEntities(result.entities);
  
  // Merge the new details with existing details, only updating fields
  // that were provided in the new command
  return {
    ...existingDetails,
    quantity: newDetails.quantity || existingDetails.quantity,
    unit: newDetails.unit || existingDetails.unit,
    position: newDetails.position || existingDetails.position,
    price: newDetails.price || existingDetails.price,
    expiry: newDetails.expiry || existingDetails.expiry,
  };
};
