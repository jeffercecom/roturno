import { useRef, useState } from 'react';

type UploadedMedia = { url: string; mediaType: 'IMAGE' | 'VIDEO' };

export default function PhotoCapture({ onImage }: { onImage: (media: UploadedMedia) => void }) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function uploadFile(file: File) {
    setError(null);
    setUploading(true);
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) {
      setError('Falta configurar Cloudinary en las variables de entorno.');
      setUploading(false);
      return;
    }

    if (file.type.startsWith('video/')) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);
        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, { method: 'POST', body: formData });
        const result = await response.json();
        if (!response.ok || !result.secure_url) throw new Error(result.error?.message || 'Cloudinary rechazó el video.');
        onImage({ url: result.secure_url, mediaType: 'VIDEO' });
      } catch (uploadError) {
        setError(String(uploadError));
      } finally {
        setUploading(false);
      }
      return;
    }

    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.src = String(reader.result);
      img.onload = () => {
        const w = img.width;
        const h = img.height;
        // Accept any image. Center-crop to target aspect 5:4 (width:height = 4:5 -> 0.8)
        const targetAspect = 4 / 5; // 0.8

        let sx = 0, sy = 0, sw = w, sh = h;
        const srcAspect = w / h;
        if (srcAspect > targetAspect) {
          // source is wider, crop width
          sw = Math.round(h * targetAspect);
          sx = Math.round((w - sw) / 2);
        } else if (srcAspect < targetAspect) {
          // source is taller/narrower, crop height
          sh = Math.round(w / targetAspect);
          sy = Math.round((h - sh) / 2);
        }

        // resize to 500x625 (5:4 vertical)
        const canvas = document.createElement('canvas');
        canvas.width = 500;
        canvas.height = 625;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(async (blob) => {
          if (!blob) {
            setError('No se pudo preparar la imagen.');
            setUploading(false);
            return;
          }
          try {
            const formData = new FormData();
            formData.append('file', blob, 'advisor-photo.jpg');
            formData.append('upload_preset', uploadPreset);
            const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
              method: 'POST',
              body: formData,
            });
            const result = await response.json();
            if (!response.ok || !result.secure_url) throw new Error(result.error?.message || 'Cloudinary rechazó la imagen.');
            onImage({ url: result.secure_url, mediaType: 'IMAGE' });
          } catch (uploadError) {
            setError(String(uploadError));
          } finally {
            setUploading(false);
          }
        }, 'image/jpeg', 0.9);
      };
    };
    reader.readAsDataURL(file);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    for (const file of files) await uploadFile(file);
    e.target.value = '';
  }

  return (
    <div>
      <div className="capture-hint">La foto se ajusta a formato vertical y se carga automáticamente.</div>
      <input ref={fileRef} type="file" accept="image/*,video/*" multiple onChange={handleFile} disabled={uploading} />
      {uploading && <div>Cargando foto...</div>}
      {error && <div style={{ color: 'darkred' }}>{error}</div>}
    </div>
  );
}
