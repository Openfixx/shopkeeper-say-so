
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import VoiceInput from '@/components/VoiceInput';
import ProductImagePicker from '@/components/ProductImagePicker';
import { getCachedImage } from '@/utils/fetchImage';
import { DbInventoryItem } from '@/lib/supabase';

// Re-export the POS component from the existing lowercase file
// Use a correct export approach that won't cause casing conflicts
export { default } from '@/pages/pos';
