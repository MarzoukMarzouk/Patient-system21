import * as htmlToImage from 'html-to-image';

export async function downloadImage(elementId, fileName) {
  const el = document.getElementById(elementId);
  if (!el) return;
  
  try {
    const dataUrl = await htmlToImage.toPng(el, {
      backgroundColor: '#ffffff',
      pixelRatio: 2,
    });
    
    const a = document.createElement('a');
    a.download = `${fileName}_${new Date().toLocaleDateString('ar-EG').replace(/\//g, '-')}.png`;
    a.href = dataUrl;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Dispatch a custom event to show a toast
    window.dispatchEvent(new CustomEvent('show-toast', { 
      detail: { msg: 'تم تحميل الصورة بنجاح', type: 'success' } 
    }));
  } catch (err) {
    console.error('Download image error:', err);
    window.dispatchEvent(new CustomEvent('show-toast', { 
      detail: { msg: 'حدث خطأ أثناء تحميل الصورة', type: 'danger' } 
    }));
  }
}
