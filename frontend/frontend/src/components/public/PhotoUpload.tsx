import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Camera, Maximize2, User } from 'lucide-react';
import { Camera as CameraComponent } from './Camera';
import { toast } from 'sonner';
import { ImageCropModal } from './ImageCropModal';

interface PhotoUploadProps {
  value: string | File;
  onChange: (value: string | File) => void;
  label: string;
  required?: boolean;
  withCamera?: boolean;
  className?: string;
  onViewPhoto?: (src: string, title: string) => void;
}

export function PhotoUpload({
  value,
  onChange,
  label,
  required = false,
  withCamera = true,
  className = '',
  onViewPhoto,
}: PhotoUploadProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);

  const validateAndUploadFile = (file: File) => {
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast.error('Only JPG and PNG files are allowed');
      return;
    }

    // Check image dimensions
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const width = img.width;
      const height = img.height;
      const aspectRatio = width / height;

      //   if (width >= 300 && height >= 300 && aspectRatio > 0.8 && aspectRatio < 1.2) {
      onChange(file);
      toast.success('Photo uploaded successfully!');
      //   } else {
      //     toast.error(
      //       'Photo must be at least 300x300 pixels with proper aspect ratio (close to square)'
      //     );
      //   }
    };
  };

  const handleCapturePhoto = (file: File) => {
    onChange(file);
    setShowCamera(false);
  };

  const renderImagePreview = (file: string | File, title: string = 'Photo Preview') => {
    if (!file)
      return (
        <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs text-center p-2">
          No Photo Uploaded
        </div>
      );

    const src = file instanceof File ? URL.createObjectURL(file) : file;

    return (
      <div
        className="relative group w-24 h-24 border-2 border-orange-100 rounded-lg overflow-hidden bg-gray-50 shadow-sm cursor-zoom-in transition-transform hover:scale-105"
        onClick={() => {
          if (onViewPhoto) {
            onViewPhoto(src, title);
          } else {
            window.open(src, '_blank');
          }
        }}
      >
        <img src={src} alt={title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Maximize2 className="w-6 h-6 text-white" />
        </div>
      </div>
    );
  };

  const photoRequirements = (
    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
      <div className="flex items-start gap-3">
        <User className="w-5 h-5 text-blue-600 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-800 mb-1">Photo Requirements</p>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Face should be centered and looking straight at camera</li>
            <li>• Ensure good lighting without shadows</li>
            <li>• Remove hats, sunglasses, or face coverings</li>
            <li>• Minimum size: 300×300 pixels (square recommended)</li>
            <li>• Maximum file size: 2MB</li>
            <li>• Accepted formats: JPG, PNG</li>
            <li>• Background should be plain and light-colored</li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <div className={className}>
      {/* <label className="text-sm font-medium mb-2 block">
        {label} {required && <span className="text-orange-600">*</span>}
      </label> */}

      <div className="space-y-4">
        {withCamera && (
          <>
            {/* Camera Option */}
            <div className="border-2 border-dashed border-orange-300 rounded-lg p-6 text-center hover:bg-orange-50 transition-colors">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCamera(true)}
                className="mb-4 border-orange-500 text-orange-600 hover:bg-orange-100"
              >
                <Camera className="w-4 h-4 mr-2" />
                Take Photo with Camera
              </Button>

              <p className="text-xs text-gray-500">
                Photo must show clear face, be well-lit, and meet size requirements
              </p>
            </div>

            {/* OR Divider */}
            <div className="flex items-center">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="mx-4 text-sm text-gray-500">OR</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>
          </>
        )}

        {/* File Upload Option */}
        <div>
          {/* <Input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) validateAndUploadFile(file);
            }}
            className="h-12"
          /> */}
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              if (file.size > 2 * 1024 * 1024) {
                toast.error('File size must be less than 2MB');
                return;
              }

              const url = URL.createObjectURL(file);
              setCropImage(url);
            }}
            className="h-12"
          />

          <p className="text-xs text-gray-500 mt-1">Accepted formats: JPG, PNG. Max size: 2MB</p>
        </div>

        {cropImage && (
          <ImageCropModal
            image={cropImage}
            onCropComplete={(file) => {
              onChange(file);
              toast.success('Photo cropped to 300×300');
            }}
            onClose={() => setCropImage(null)}
          />
        )}

        {photoRequirements}

        {/* Photo Preview */}
        {value && (
          <div className="mt-4 p-4 border border-gray-200 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Photo Preview:</p>
            {renderImagePreview(value, label)}
          </div>
        )}
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <CameraComponent
          onCapture={handleCapturePhoto}
          onClose={() => setShowCamera(false)}
          title={`Take ${label}`}
          photoRequirements={photoRequirements}
          required={required}
        />
      )}
    </div>
  );
}
