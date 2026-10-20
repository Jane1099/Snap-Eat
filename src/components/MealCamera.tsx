import { useEffect, useRef, useState } from 'react';
import { Camera, SwitchCamera, Zap, X } from 'lucide-react';
import { toast } from 'sonner';
export default function MealCamera({ onCapture, onClose }: { onCapture: (file: File) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null); const stream = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<'environment' | 'user'>('environment'); const [ready, setReady] = useState(false); const [torch, setTorch] = useState(false); const [hasTorch, setHasTorch] = useState(false); const [error, setError] = useState('');
  useEffect(() => {
    let active = true; setReady(false); setError(''); setTorch(false); setHasTorch(false);
    if (!navigator.mediaDevices?.getUserMedia) { setError('Live camera needs HTTPS and a supported browser. You can still upload a photo.'); return; }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing } }, audio: false }).then(async next => {
      if (!active) { next.getTracks().forEach(t => t.stop()); return; }
      stream.current = next; if (video.current) { video.current.srcObject = next; await video.current.play(); }
      if (!active) { next.getTracks().forEach(t => t.stop()); return; }
      const capabilities = next.getVideoTracks()[0].getCapabilities?.() as (MediaTrackCapabilities & { torch?: boolean }) | undefined;
      setHasTorch(Boolean(capabilities?.torch)); setReady(true);
    }).catch(cause => {
      if (!active) return;
      stream.current?.getTracks().forEach(t => t.stop()); stream.current = null;
      const name = cause instanceof Error ? cause.name : 'UnknownError';
      console.warn('[meal-camera] Camera start failed', { name });
      setError(name === 'NotAllowedError' || name === 'SecurityError'
        ? 'Allow camera access in your browser’s site settings, then reopen the camera. You can also upload a photo.'
        : name === 'NotFoundError'
          ? 'No camera was found on this device. Upload a meal photo instead.'
          : name === 'NotReadableError'
            ? 'The camera may be in use by another app. Close that app and try again, or upload a photo.'
            : 'The camera could not start. Reopen this view and try again, or upload a photo.');
    });
    return () => { active = false; stream.current?.getTracks().forEach(t => t.stop()); stream.current = null; };
  }, [facing]);
  const capture = () => {
    const current = video.current; if (!current || !ready) return;
    const canvas = document.createElement('canvas'); canvas.width = current.videoWidth; canvas.height = current.videoHeight; canvas.getContext('2d')!.drawImage(current, 0, 0);
    canvas.toBlob(blob => { if (blob) { onCapture(new File([blob], 'meal.jpg', { type: 'image/jpeg' })); onClose(); } }, 'image/jpeg', .9);
  };
  return <div className="relative overflow-hidden rounded-2xl bg-secondary"><video ref={video} autoPlay playsInline muted className="h-72 w-full object-cover" /><button className="absolute right-3 top-3 rounded-full bg-card p-2" aria-label="Close camera" onClick={onClose}><X size={17} /></button>{error && <p role="alert" className="absolute inset-x-4 top-16 rounded-xl bg-card p-4 text-sm">{error}</p>}<div className="flex items-center justify-center gap-6 p-4"><button aria-label="Flip camera" className="quiet" onClick={() => setFacing(facing === 'environment' ? 'user' : 'environment')}><SwitchCamera size={20} /></button><button disabled={!ready} aria-label="Capture meal" className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-primary/30 bg-primary text-primary-foreground disabled:opacity-40" onClick={capture}><Camera size={26} /></button>{hasTorch && <button aria-label="Toggle flashlight" className={`quiet ${torch ? 'text-amber-400' : ''}`} onClick={async () => { try { const track = stream.current?.getVideoTracks()[0]; if (track) { await track.applyConstraints({ advanced: [{ torch: !torch } as MediaTrackConstraintSet] }); setTorch(!torch); } } catch { toast.info('This camera could not enable its flashlight.'); } }}><Zap size={20} /></button>}</div></div>;
}
