import React from 'react';

export default function Watermark({ user }) {
  const watermarkText = user?.email || 'SQEForge';

  // An array of positions and rotations for a denser watermark pattern
  const watermarks = [
    { top: '10%', left: '10%', rotate: '-rotate-45' },
    { top: '50%', left: '50%', rotate: '-rotate-45' },
    { top: '90%', left: '90%', rotate: '-rotate-45' },
    { top: '30%', left: '70%', rotate: '-rotate-45' },
    { top: '70%', left: '30%', rotate: '-rotate-45' },
    { top: '5%', left: '60%', rotate: '-rotate-45' },
    { top: '95%', left: '40%', rotate: '-rotate-45' },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {watermarks.map((style, index) => (
        <div
          key={index}
          className={`absolute transform ${style.rotate} text-black/5 whitespace-nowrap text-[5vh] font-bold`}
          style={{ top: style.top, left: style.left, transform: `translate(-50%, -50%) ${style.rotate.includes('-') ? 'rotate(-45deg)' : 'rotate(45deg)'}` }}
        >
          {`${watermarkText} `.repeat(3)}
        </div>
      ))}
    </div>
  );
}