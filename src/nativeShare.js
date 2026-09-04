import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { isNativeApp } from './nativeGoogleSignIn.js';

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// The Web Share API (navigator.share) generally can't hand files to anything
// inside an Android WebView — it's either missing entirely or navigator.canShare
// quietly returns false, so every card-share button (Thank You/Receipt/
// Quotation in the Admin Portal, the team "Share My Card" feature) silently
// fell back to a plain download instead of opening WhatsApp inside the app.
// Capacitor's own Share plugin talks to the real native Android share sheet
// instead, so it needs a file written to disk first (Share.share only takes
// a file:// URI, not a raw Blob) via the Filesystem plugin.
//
// Throws Error('SHARE_UNSUPPORTED') only for the genuinely-unsupported web
// case — callers should show their download fallback for that specific
// error and otherwise treat a thrown error as the user just cancelling the
// share sheet (nothing to do).
export async function shareImage({ blob, filename, title }) {
  if (isNativeApp()) {
    const base64Data = await blobToBase64(blob);
    const written = await Filesystem.writeFile({ path: filename, data: base64Data, directory: Directory.Cache });
    await Share.share({ title, url: written.uri, dialogTitle: title });
    return;
  }
  const file = new File([blob], filename, { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({ files: [file], title });
    return;
  }
  throw new Error('SHARE_UNSUPPORTED');
}
