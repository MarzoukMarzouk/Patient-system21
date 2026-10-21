import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)',
          borderRadius: '16px',
        }}
      >
        <svg width="42" height="42" viewBox="0 0 64 64" fill="none">
          <path d="M32 49S16 38.5 16 26.5C16 20.7 20.7 16 26.5 16C29.6 16 32 17.5 32 17.5S34.4 16 37.5 16C43.3 16 48 20.7 48 26.5C48 38.5 32 49 32 49Z" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 28H26L29 20L34 36L37 28H43" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    { ...size }
  );
}