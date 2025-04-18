import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { useVoiceRecognition } from '@/lib/voice';
import { toast } from 'sonner';

type FormData = {
  name: string;
  quantity: number;
  unit: string;
  position: string;
  imageUrl?: string;
};

export default function AddProductForm() {
  const { register, handleSubmit, setValue, watch } = useForm<FormData>();
  const { isListening, listen, commandResult } = useVoiceRecognition();
  const imageUrl = watch('imageUrl');

  // Auto-fill form from voice command
  useEffect(() => {
    if (commandResult) {
      setValue('name', commandResult.productName);
      setValue('quantity', commandResult.quantity?.value || 0);
      setValue('unit', commandResult.quantity?.unit || 'kg');
      setValue('position', commandResult.position || 'Rack 1');
      setValue('imageUrl', commandResult.imageUrl);
    }
  }, [commandResult, setValue]);

  const onSubmit = (data: FormData) => {
    console.log('Submitting:', data);
    // Add your Supabase insert logic here
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Product Name */}
        <div>
          <label>Product Name</label>
          <input {...register('name')} />
        </div>

        {/* Voice Button */}
        <div className="flex items-end">
          <Button
            type="button"
            onClick={listen}
            disabled={isListening}
            variant="secondary"
          >
            {isListening ? 'Listening...' : 'Voice Input'}
          </Button>
        </div>

        {/* Quantity Fields */}
        <div>
          <label>Quantity</label>
          <input type="number" {...register('quantity')} />
        </div>
        <div>
          <label>Unit</label>
          <select {...register('unit')}>
            <option value="kg">Kilograms</option>
            <option value="g">Grams</option>
            <option value="l">Liters</option>
            <option value="ml">Milliliters</option>
          </select>
        </div>

        {/* Position */}
        <div>
          <label>Storage Position</label>
          <input {...register('position')} />
        </div>

        {/* Image Preview */}
       // Add this image loading state
const [isImageLoading, setIsImageLoading] = useState(false);

// Modify the image display section
{commandResult?.imageUrl ? (
  <div className="relative">
    {isImageLoading && (
      <div className="absolute inset-0 bg-gray-100 animate-pulse" />
    )}
    <img
      src={commandResult.imageUrl}
      alt={commandResult.productName}
      className="rounded border"
      onLoad={() => setIsImageLoading(false)}
      onError={(e) => {
        e.currentTarget.src = '';
        setIsImageLoading(false);
      }}
    />
  </div>
) : null}
        )}
      </div>

      <Button type="submit">Add Product</Button>
    </form>
  );
}
