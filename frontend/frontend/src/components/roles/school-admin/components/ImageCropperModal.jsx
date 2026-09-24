import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../ui/dialog';
import { Button } from '../../../ui/button';
import getCroppedImg from '../../../../utils/canvasUtils';

export const ImageCropperModal = ({
  isOpen,
  onClose,
  imageSrc,
  aspectRatio = 1,
  onCropComplete,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const handleCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    try {
      if (croppedAreaPixels) {
        const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
        onCropComplete(croppedImage);
        onClose();
        // Reset zoom and crop
        setZoom(1);
        setCrop({ x: 0, y: 0 });
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-w-4xl flex flex-col h-[80vh] max-h-[600px]">
        <DialogHeader>
          <DialogTitle>Crop Background Image</DialogTitle>
        </DialogHeader>
        <div className="relative flex-1 bg-black w-full overflow-hidden rounded-md">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            showGrid={true}
            onCropChange={setCrop}
            onCropComplete={handleCropComplete}
            onZoomChange={setZoom}
            objectFit="contain"
            restrictPosition={true}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Set Background</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
