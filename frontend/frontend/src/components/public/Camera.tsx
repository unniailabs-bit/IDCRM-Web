import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Webcam from 'react-webcam';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import {
  Camera as CameraIcon,
  X,
  FlipHorizontal,
  RefreshCw,
  Check,
  AlertCircle,
} from 'lucide-react';

interface CameraProps {
  onCapture: (file: File) => void;
  onClose: () => void;
  title?: string;
  photoRequirements?: React.ReactNode;
  required?: boolean;
}

export function Camera({
  onCapture,
  onClose,
  title = 'Take Photo',
  photoRequirements,
  required = false,
}: CameraProps) {
  const { t } = useTranslation();
  const [faceAligned, setFaceAligned] = useState(false);
  const [faceAlignedMessage, setFaceAlignedMessage] = useState<string>(
    t('publicForm.photoUpload.alignFace')
  );
  const [faceAlignedColor, setFaceAlignedColor] = useState<string>('text-yellow-600');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const webcamRef = useRef<Webcam>(null);

  const getCameraDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === 'videoinput');
      setAvailableDevices(videoDevices);

      // Set default device (front camera if available)
      if (videoDevices.length > 0) {
        // Try to find front camera
        const frontCamera = videoDevices.find(
          (device) =>
            device.label.toLowerCase().includes('front') ||
            device.label.toLowerCase().includes('facetime')
        );

        if (frontCamera) {
          setSelectedDeviceId(frontCamera.deviceId);
          setFacingMode('user');
        } else {
          setSelectedDeviceId(videoDevices[0].deviceId);
          setFacingMode('environment');
        }
      }
    } catch (error) {
      console.error('Error getting camera devices:', error);
      toast.error(t('publicForm.photoUpload.cameraAccessError'));
    }
  }, []);

  const switchCamera = () => {
    if (availableDevices.length <= 1) {
      toast.info(t('publicForm.photoUpload.oneCameraOnly'));
      return;
    }

    const currentIndex = availableDevices.findIndex(
      (device) => device.deviceId === selectedDeviceId
    );
    const nextIndex = (currentIndex + 1) % availableDevices.length;
    const nextDevice = availableDevices[nextIndex];

    setSelectedDeviceId(nextDevice.deviceId);

    const deviceLabel = nextDevice.label.toLowerCase();
    if (deviceLabel.includes('front') || deviceLabel.includes('facetime')) {
      setFacingMode('user');
    } else if (deviceLabel.includes('back') || deviceLabel.includes('rear')) {
      setFacingMode('environment');
    } else {
      setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
    }

    toast.success(t('publicForm.photoUpload.switchedTo', { label: nextDevice.label || t('publicForm.photoUpload.camera') }));
  };

  const getCurrentCameraLabel = () => {
    const device = availableDevices.find((d) => d.deviceId === selectedDeviceId);
    if (!device) return facingMode === 'user' ? t('publicForm.photoUpload.frontCamera') : t('publicForm.photoUpload.backCamera');

    const label = device.label || '';
    if (label.toLowerCase().includes('back') || label.toLowerCase().includes('rear')) {
      return t('publicForm.photoUpload.backCamera');
    } else if (label.toLowerCase().includes('front') || label.toLowerCase().includes('facetime')) {
      return t('publicForm.photoUpload.frontCamera');
    }
    return label || t('publicForm.photoUpload.camera');
  };

  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const capturePhoto = () => {
    if (webcamRef.current) {
      const imageSrc = (webcamRef.current as any).getScreenshot();
      const img = new Image();
      img.src = imageSrc;
      img.onload = () => {
        const width = img.width;
        const height = img.height;
        const aspectRatio = width / height;

        if (width >= 300 && height >= 300 && aspectRatio > 0.8 && aspectRatio < 1.2) {
          const file = dataURLtoFile(imageSrc, 'photo.jpg');
          onCapture(file);
          onClose();
          toast.success(t('publicForm.photoUpload.captureSuccess'));
        } else {
          toast.error(t('publicForm.photoUpload.invalidPhotoSize'));
        }
      };
    }
  };

  const checkFaceAlignment = () => {
    setTimeout(() => {
      setFaceAligned(true);
      setFaceAlignedMessage(t('publicForm.photoUpload.faceAlignedReady'));
      setFaceAlignedColor('text-green-600');
    }, 3000);
  };

  useEffect(() => {
    getCameraDevices();
    setTimeout(() => checkFaceAlignment(), 100);

    return () => {
      // Cleanup when component unmounts
      setFaceAligned(false);
    };
  }, [getCameraDevices]);

  const videoConstraints = {
    deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
    facingMode: facingMode,
    width: { ideal: 300 },
    height: { ideal: 300 },
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold">{title}</h3>
              {/* <p className="text-sm text-gray-500 mt-1">{getCurrentCameraLabel()}</p> */}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="my-2 space-y-1">
            {availableDevices.map((device, index) => (
              <div
                key={device.deviceId}
                className={`text-xs p-2 rounded ${device.deviceId === selectedDeviceId
                    ? 'bg-blue-100 border border-blue-200'
                    : 'bg-gray-100'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${device.deviceId === selectedDeviceId ? 'bg-blue-600' : 'bg-gray-400'
                      }`}
                  />
                  <span className="font-medium">Camera {index + 1}:</span>
                  <span className="text-gray-600 truncate">
                    {device.label || `Camera ${index + 1}`}
                  </span>
                  {device.deviceId === selectedDeviceId && (
                    <span className="ml-auto text-blue-600 font-medium text-xs">{t('publicForm.photoUpload.active')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Face Alignment Status */}
          {/* <div
            className={`mb-4 p-3 rounded-md ${
              faceAligned
                ? 'bg-green-50 border border-green-200'
                : 'bg-yellow-50 border border-yellow-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {faceAligned ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-yellow-600" />
              )}
              <span className={`text-sm font-medium ${faceAlignedColor}`}>
                {faceAlignedMessage}
              </span>
            </div>
          </div> */}

          {/* Camera with Face Alignment Overlay */}
          <div className="relative mb-4 bg-black rounded-lg overflow-hidden">
            <div className="relative" style={{ paddingTop: '75%' }}>
              <div className="absolute inset-0">
                {/* Webcam Component */}
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    className="w-full h-full object-cover"
                    style={{
                      // transform: facingMode == 'user' ? 'scaleX(1)' : 'scaleX(-1) md:scaleX(1)',
                      transform: facingMode === 'user' ? 'scaleX(-1)' : 'scaleX(1)',
                      WebkitTransform: facingMode === 'user' ? 'scaleX(-1)' : 'scaleX(1)',
                    }}
                    videoConstraints={videoConstraints}
                    onUserMedia={() => {
                      console.log('Camera access granted');
                    }}
                    onUserMediaError={(error) => {
                      console.error('Camera error:', error);
                      toast.error(t('publicForm.photoUpload.cameraAccessFail'));
                    }}
                  />
                </div>

                {/* Face alignment guide overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-48 h-48">
                    {/* Outer square */}
                    <div className="absolute inset-0 border-2 border-green-500 rounded-lg opacity-50"></div>

                    {/* Center guides */}
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-green-500 opacity-30 transform -translate-y-1/2"></div>
                    <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-green-500 opacity-30 transform -translate-x-1/2"></div>

                    {/* Corner guides */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-green-500"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-green-500"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-green-500"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-green-500"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Camera Controls Overlay */}
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                onClick={switchCamera}
                size="sm"
                variant="secondary"
                className="bg-white/90 hover:bg-white backdrop-blur-sm"
                disabled={availableDevices.length <= 1}
                title={availableDevices.length <= 1 ? t('publicForm.photoUpload.oneCameraOnly') : t('publicForm.photoUpload.switch')}
              >
                <FlipHorizontal className="w-4 h-4 mr-2" />
                {t('publicForm.photoUpload.switch')}
                {availableDevices.length > 1 && (
                  <span className="ml-1 text-xs opacity-75">({availableDevices.length})</span>
                )}
              </Button>
            </div>
          </div>

          {/* Camera Info */}
          {availableDevices.length > 0 && (
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium">{t('publicForm.photoUpload.availableCameras')}:</span>{' '}
                  <span className="text-gray-600">
                    {availableDevices.length} {t('publicForm.photoUpload.camera')}{availableDevices.length !== 1 ? 's' : ''} {t('publicForm.photoUpload.detected')}
                  </span>
                </div>
                {availableDevices.length > 1 && (
                  <Button onClick={switchCamera} size="sm" variant="ghost" className="h-8">
                    <RefreshCw className="w-3 h-3 mr-2" />
                    {t('publicForm.photoUpload.switchCameraButton')}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Camera Controls */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={onClose}>
              {t('publicForm.photoUpload.cancel')}
            </Button>
            <Button
              onClick={capturePhoto}
              className="bg-green-600 hover:bg-green-700"
              disabled={!faceAligned && required}
            >
              <CameraIcon className="w-4 h-4 mr-2" />
              {t('publicForm.photoUpload.capturePhotoButton')}
            </Button>
          </div>

          {/* Photo Requirements */}
          {photoRequirements ? (
            photoRequirements
          ) : (
            <div className="mt-4 text-sm text-gray-600">
              <p className="font-medium mb-1">{t('publicForm.photoUpload.instructions')}</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>{t('publicForm.photoUpload.instrPosition')}</li>
                <li>{t('publicForm.photoUpload.instrLook')}</li>
                <li>{t('publicForm.photoUpload.instrLighting')}</li>
                <li>{t('publicForm.photoUpload.instrSwitch')}</li>
                <li>{t('publicForm.photoUpload.instrWait')}</li>
                <li>{t('publicForm.photoUpload.instrCapture')}</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
