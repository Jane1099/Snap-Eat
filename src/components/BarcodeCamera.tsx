import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
export default function BarcodeCamera({ onCode }: {onCode:(code:string)=>void}) {
 const video=useRef<HTMLVideoElement>(null);const [error,setError]=useState('');
 useEffect(()=>{const reader=new BrowserMultiFormatReader();let found=false;reader.decodeFromVideoDevice(undefined,video.current!,result=>{if(result&&!found){found=true;onCode(result.getText());reader.reset();}}).catch(e=>setError(e.name==='NotAllowedError'?'Camera access was denied. Enter the barcode below.':'Unable to access your camera. Enter the barcode below.'));return()=>{reader.reset();};},[onCode]);
 return <div className="relative overflow-hidden rounded-2xl bg-secondary"><video ref={video} className="h-56 w-full object-cover" muted playsInline/><div className="pointer-events-none absolute inset-x-10 inset-y-16 rounded-xl border-2 border-primary"/><p className="absolute inset-x-0 bottom-3 text-center text-xs text-white">{error||'Position the barcode inside the frame'}</p></div>;
}
