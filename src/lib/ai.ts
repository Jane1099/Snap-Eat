import { supabase } from '@/integrations/supabase/client';
export async function askAI(body: Record<string, unknown>) {
 const { data, error } = await supabase.functions.invoke('mind-eat-ai', { body });
 if(error) { let message=error.message; if(error.context instanceof Response) { try { const result=await error.context.json(); message=result.error || message; } catch {} } throw new Error(message); }
 if(data?.error)throw new Error(data.error); return data;
}
export async function uploadFoodPhoto(file: File, userId: string) {
 if(!file.type.startsWith('image/'))throw new Error('Select an image file.');
 if(file.size>20*1024*1024)throw new Error('Choose a photo smaller than 20 MB.');
 const url=URL.createObjectURL(file); const image=new Image();
 try { await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(new Error('This image format is not supported. Try JPEG or PNG.'));image.src=url;});
 const scale=Math.min(1,1200/Math.max(image.width,image.height));const canvas=document.createElement('canvas');canvas.width=image.width*scale;canvas.height=image.height*scale;canvas.getContext('2d')!.drawImage(image,0,0,canvas.width,canvas.height);const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Could not compress image')),'image/jpeg',.8));const path=`${userId}/${crypto.randomUUID()}.jpg`;const {error}=await supabase.storage.from('food-photos').upload(path,blob,{contentType:'image/jpeg'});if(error)throw error;return path;
 }finally{URL.revokeObjectURL(url);}
}
