import { useState } from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export default function Logo({ className = '', size = 128 }: LogoProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const officialLogoUrl =
    'https://lh3.googleusercontent.com/aida/AEtjO1XnPjg13rPJOlw0Gx_py8TO6qkLEq5QyKsCMf7iO_4YObDWuIW4z6ma9fJ0ZC7VJSkbI58Sic6JKY5VV6BvKnFAILf-T4XBMpqcLPW0Zk9cnp-ICIvqwRgQXQy4dBMdGzDWyZONI9zO4bwg16EhRtULnPaNa7NPi6w0G75hl5bCICg4_CGKO-NOOcyb5WxjBFFlU3veY5Y8XxmGjpoqx5P26mcwxNEidRSy4B6gL1UqKZSMXa44Zr4CUNI';

  if (!imgFailed) {
    return (
      <img
        src={officialLogoUrl}
        alt="AgroCordS - Ventana de Aplicación Logo Oficial"
        onError={() => setImgFailed(true)}
        className={`object-contain rounded-2xl drop-shadow-md ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  // High-fidelity SVG recreation of Image 11
  return (
    <div
      className={`relative rounded-3xl overflow-hidden shadow-lg flex items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        background: 'radial-gradient(circle at 35% 30%, #152d58 0%, #0a1733 65%, #050c1e 100%)'
      }}
    >
      <svg
        viewBox="0 0 512 512"
        className="w-full h-full p-4"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Radar grid coordinates */}
        <circle cx="256" cy="240" r="160" stroke="#254a88" strokeWidth="2" strokeDasharray="6 6" opacity="0.4" />
        <line x1="256" y1="80" x2="256" y2="400" stroke="#254a88" strokeWidth="1.5" opacity="0.3" />
        <line x1="96" y1="240" x2="416" y2="240" stroke="#254a88" strokeWidth="1.5" opacity="0.3" />

        {/* Optical Sensor Brackets */}
        <path
          d="M 175 140 H 130 C 110 140 95 155 95 175 V 290 C 95 310 110 325 130 325 H 175"
          stroke="#4ba3ff"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <path
          d="M 337 140 H 382 C 402 140 417 155 417 175 V 290 C 417 310 402 325 382 325 H 337"
          stroke="#4ba3ff"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <line x1="175" y1="140" x2="337" y2="140" stroke="#3b82f6" strokeWidth="8" strokeLinecap="round" opacity="0.7" />
        <line x1="175" y1="325" x2="337" y2="325" stroke="#3b82f6" strokeWidth="8" strokeLinecap="round" opacity="0.7" />

        {/* Tactical Air/Wind Streams */}
        <path d="M 120 200 Q 160 190 200 205" stroke="#70afff" strokeWidth="4" strokeLinecap="round" opacity="0.5" />
        <path d="M 310 200 Q 350 215 390 195" stroke="#70afff" strokeWidth="4" strokeLinecap="round" opacity="0.5" />
        <path d="M 310 260 Q 360 270 395 240" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" opacity="0.4" />

        {/* Center Water Droplet with Specular Gradient */}
        <defs>
          <linearGradient id="dropletGradient" x1="256" y1="130" x2="256" y2="330" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#dbeafe" />
            <stop offset="35%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>
        <path
          d="M 256 135 C 256 135 190 240 190 278 C 190 315 220 342 256 342 C 292 342 322 315 322 278 C 322 240 256 135 256 135 Z"
          fill="url(#dropletGradient)"
          filter="drop-shadow(0 8px 16px rgba(0, 35, 111, 0.5))"
        />

        {/* Specular Wave inside droplet */}
        <path
          d="M 256 138 C 256 138 215 235 235 295 C 242 318 256 340 256 340 C 256 340 240 300 246 270 C 252 240 256 138 256 138 Z"
          fill="#ffffff"
          opacity="0.8"
        />

        {/* Target Reticle Eye */}
        <circle cx="256" cy="275" r="16" fill="#0b1736" stroke="#ffffff" strokeWidth="4" />
        <circle cx="256" cy="275" r="5" fill="#ffffff" />

        {/* Brand Text */}
        <text
          x="256"
          y="410"
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="'Space Grotesk', sans-serif"
          fontWeight="700"
          fontSize="46"
          letterSpacing="2"
        >
          AgroCordS
        </text>
        <text
          x="256"
          y="442"
          textAnchor="middle"
          fill="#70afff"
          fontFamily="'Space Grotesk', sans-serif"
          fontWeight="600"
          fontSize="17"
          letterSpacing="4"
        >
          VENTANA DE APLICACIÓN
        </text>

        {/* Sub-badge */}
        <rect x="186" y="460" width="140" height="24" rx="12" fill="none" stroke="#2563eb" strokeWidth="2" />
        <text
          x="256"
          y="476"
          textAnchor="middle"
          fill="#93c5fd"
          fontFamily="'Space Grotesk', sans-serif"
          fontWeight="600"
          fontSize="12"
          letterSpacing="2"
        >
          AGRO DECISIÓN
        </text>
      </svg>
    </div>
  );
}
