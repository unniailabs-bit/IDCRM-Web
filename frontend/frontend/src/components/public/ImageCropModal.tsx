import Cropper from 'react-easy-crop';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { getCroppedImg } from '@/utils/cropImage';

export function ImageCropModal({
  image,
  onCropComplete,
  onClose,
}: {
  image: string;
  onCropComplete: (file: File) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedPixels, setCroppedPixels] = useState<any>(null);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
      <div className="bg-white p-4 rounded-lg w-[90vw] max-w-md">
        <div className="relative w-full h-96">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, pixels) => setCroppedPixels(pixels)}
          />
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            {t('publicForm.photoUpload.cancel')}
          </Button>
          <Button
            onClick={async () => {
              const file = await getCroppedImg(image, croppedPixels);
              onCropComplete(file);
              onClose();
            }}
          >
            {t('publicForm.photoUpload.cropAndSave')}
          </Button>
        </div>
      </div>
    </div>
  );
}
