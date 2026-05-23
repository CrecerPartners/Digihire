import React from 'react';

interface GradientBarsProps {
  numBars: number;
  gradientFrom: string;
  gradientTo: string;
  animationDuration: number;
}

const GradientBars: React.FC<GradientBarsProps> = ({
  numBars,
  gradientFrom,
  gradientTo,
  animationDuration,
}) => {
  const calculateHeight = (index: number, total: number) => {
    const position = index / (total - 1);
    const center = 0.5;
    const distanceFromCenter = Math.abs(position - center);
    const heightPercentage = Math.pow(distanceFromCenter * 2, 1.2);
    return 30 + 70 * heightPercentage; // minHeight=30, maxHeight=100
  };

  return (
    <>
      <style>{`
        @keyframes pulseBar {
          0%   { transform: scaleY(var(--bar-scale)); }
          100% { transform: scaleY(calc(var(--bar-scale) * 0.68)); }
        }
      `}</style>
      {/* Fills the entire positioned parent (section) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'flex-end',   /* bars grow from bottom */
          width: '100%',
          height: '100%',
          transform: 'translateZ(0)',
        }}
      >
        {Array.from({ length: numBars }).map((_, i) => {
          const scale = calculateHeight(i, numBars) / 100;
          return (
            <div
              key={i}
              style={{
                flex: `1 0 calc(100% / ${numBars})`,
                maxWidth: `calc(100% / ${numBars})`,
                height: '100%',
                background: `linear-gradient(to top, ${gradientFrom}, ${gradientTo})`,
                transform: `scaleY(${scale})`,
                transformOrigin: 'bottom',
                animation: `pulseBar ${animationDuration}s ease-in-out ${i * 0.1}s infinite alternate`,
                // @ts-ignore
                '--bar-scale': scale,
              }}
            />
          );
        })}
      </div>
    </>
  );
};

/* ─────────────────────────────────────────────────────── */

interface GradientBarsBackgroundProps {
  numBars?: number;
  gradientFrom?: string;
  gradientTo?: string;
  animationDuration?: number;
  backgroundColor?: string;
  /** Optional CSS gradient/color placed between bars and children */
  overlay?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export default function GradientBarsBackground({
  numBars = 15,
  gradientFrom = 'rgb(0, 194, 255)',
  gradientTo = 'transparent',
  animationDuration = 2,
  backgroundColor = 'rgb(6, 17, 31)',
  overlay,
  className = '',
  style,
  children,
}: GradientBarsBackgroundProps) {
  return (
    <section
      style={{ backgroundColor, position: 'relative', overflow: 'hidden', ...style }}
      className={className}
    >
      {/* Layer 0 — animated gradient bars */}
      <GradientBars
        numBars={numBars}
        gradientFrom={gradientFrom}
        gradientTo={gradientTo}
        animationDuration={animationDuration}
      />

      {/* Layer 1 — optional darkening overlay */}
      {overlay && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            background: overlay,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Layer 2 — content */}
      {children && (
        <div style={{ position: 'relative', zIndex: 2, width: '100%' }}>
          {children}
        </div>
      )}
    </section>
  );
}

export { GradientBarsBackground };

