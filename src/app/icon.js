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
          position: 'relative',
        }}
      >
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <rect x="16" y="6" width="8" height="28" rx="4" fill="white" />
          <rect x="6" y="16" width="28" height="8" rx="4" fill="white" />
          <path d="M9 20h6l3-8 6 16 3-8h4" stroke="#0d6efd" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    { ...size }
  );
}