
/**
 * Voice Command Parser Tests
 * 
 * This file contains tests for the voice command parsing functionality.
 * To run these tests, you would typically use a testing framework like Jest.
 */

import { 
  normalizeUnit, 
  validateProductDetails, 
  extractProductDetails 
} from '../voiceCommandUtils';

/**
 * Test: normalizeUnit function
 * Purpose: Verify the unit normalization works for various inputs
 */
async function testUnitNormalization() {
  const tests = [
    { input: 'kg', expected: 'kg' },
    { input: 'kilos', expected: 'kg' },
    { input: 'kgs', expected: 'kg' },
    { input: 'kilogram', expected: 'kg' },
    { input: 'kilograms', expected: 'kg' },
    { input: 'packet', expected: 'packet' },
    { input: 'packets', expected: 'packet' },
    { input: 'pack', expected: 'packet' },
    { input: 'packs', expected: 'packet' },
    { input: 'sachet', expected: 'packet' },
    { input: 'bottle', expected: 'bottle' },
    { input: 'bottles', expected: 'bottle' },
    { input: 'btl', expected: 'bottle' },
    { input: 'can', expected: 'can' },
    { input: 'cans', expected: 'can' },
    { input: 'piece', expected: 'piece' },
    { input: 'pieces', expected: 'piece' },
    { input: 'pc', expected: 'piece' },
    { input: 'pcs', expected: 'piece' },
    { input: 'unit', expected: 'piece' },
    { input: 'units', expected: 'piece' },
  ];

  for (const test of tests) {
    const result = normalizeUnit(test.input);
    console.assert(
      result === test.expected,
      `Expected "${test.input}" to normalize to "${test.expected}", got "${result}"`
    );
  }

  console.log('Unit normalization tests completed');
}

/**
 * Test: extractProductDetails function
 * Purpose: Verify product extraction from various command formats
 */
async function testProductExtraction() {
  const tests = [
    {
      command: "Add 5 kg rice",
      expected: {
        name: "rice",
        quantity: 5,
        unit: "kg"
      }
    },
    {
      command: "Add four packets of milk",
      expected: {
        name: "milk",
        quantity: 4,
        unit: "packet"
      }
    },
    {
      command: "Need 3 cans of beans from storage",
      expected: {
        name: "beans",
        quantity: 3,
        unit: "can",
        position: "Storage"
      }
    },
    {
      command: "Put in 2 bottles of water, expiring next week",
      expected: {
        name: "water",
        quantity: 2,
        unit: "bottle",
        expiry: "next week"
      }
    },
    {
      command: "5 sachets of tea, aisle 3",
      expected: {
        name: "tea",
        quantity: 5,
        unit: "packet",
        position: "aisle 3"
      }
    }
  ];

  for (const test of tests) {
    const result = await extractProductDetails(test.command);
    
    console.log(`Command: "${test.command}"`);
    console.log('Expected:', test.expected);
    console.log('Result:', result);
    
    // Check name
    console.assert(
      result.name.includes(test.expected.name),
      `Expected product name to include "${test.expected.name}", got "${result.name}"`
    );
    
    // Check quantity
    console.assert(
      result.quantity === test.expected.quantity,
      `Expected quantity to be ${test.expected.quantity}, got ${result.quantity}`
    );
    
    // Check unit
    console.assert(
      result.unit === test.expected.unit,
      `Expected unit to be "${test.expected.unit}", got "${result.unit}"`
    );
    
    // Check position if expected
    if (test.expected.position) {
      console.assert(
        result.position?.toLowerCase().includes(test.expected.position.toLowerCase()),
        `Expected position to include "${test.expected.position}", got "${result.position}"`
      );
    }
    
    // Check expiry if expected
    if (test.expected.expiry) {
      console.assert(
        result.expiry?.includes(test.expected.expiry),
        `Expected expiry to include "${test.expected.expiry}", got "${result.expiry}"`
      );
    }
    
    console.log('---');
  }

  console.log('Product extraction tests completed');
}

/**
 * Test: validateProductDetails function
 * Purpose: Verify validation rules for product details
 */
function testProductValidation() {
  const tests = [
    {
      product: {
        name: "milk",
        quantity: 2,
        unit: "bottle",
        position: "Fridge"
      },
      expected: { isValid: true, missingFields: [] }
    },
    {
      product: {
        name: "",
        quantity: 2,
        unit: "bottle",
        position: "Fridge"
      },
      expected: { isValid: false, missingFields: ["product name"] }
    },
    {
      product: {
        name: "milk",
        quantity: 0,
        unit: "bottle",
        position: "Fridge"
      },
      expected: { isValid: false, missingFields: ["quantity"] }
    },
    {
      product: {
        name: "milk",
        quantity: 2,
        unit: "",
        position: "Fridge"
      },
      expected: { isValid: false, missingFields: ["unit"] }
    },
    {
      product: {
        name: "milk",
        quantity: 2,
        unit: "bottle",
        position: ""
      },
      expected: { isValid: false, missingFields: ["location"] }
    }
  ];

  for (const test of tests) {
    const result = validateProductDetails(test.product);
    
    console.log('Product:', test.product);
    console.log('Expected validation:', test.expected);
    console.log('Result validation:', result);
    
    console.assert(
      result.isValid === test.expected.isValid,
      `Expected isValid to be ${test.expected.isValid}, got ${result.isValid}`
    );
    
    console.assert(
      result.missingFields.length === test.expected.missingFields.length,
      `Expected ${test.expected.missingFields.length} missing fields, got ${result.missingFields.length}`
    );
    
    for (const field of test.expected.missingFields) {
      console.assert(
        result.missingFields.includes(field),
        `Expected missing fields to include "${field}"`
      );
    }
    
    console.log('---');
  }

  console.log('Product validation tests completed');
}

// Run tests
export const runVoiceCommandTests = () => {
  console.log('=== Running Voice Command Tests ===');
  
  testUnitNormalization();
  testProductValidation();
  // Note: extractProductDetails is async, so it should be run separately
  // or with a proper test runner
  
  console.log('=== Tests Complete ===');
};

// For manual testing in browser console
(window as any).runVoiceCommandTests = runVoiceCommandTests;
(window as any).testProductExtraction = testProductExtraction;
