import { useState } from 'react';

const NODE_TYPES = [
  { key: 'options', label: 'OPTIONS', angle: -90, radius: 155 },
  { key: 'tradeoffs', label: 'TRADE-OFFS', angle: -45, radius: 175 },
  { key: 'assumptions', label: 'ASSUMPTIONS', angle: 0, radius: 155 },
  { key: 'evidenceGaps', label: 'EVIDENCE GAPS', angle: 45, radius: 175 },
  { key: 'overlookedFactors', label: 'OUTSIDE THE FRAME', angle: 90, radius: 155 },
  { key: 'reasoningTensions', label: 'TENSIONS', angle: 135, radius: 175 },
  { key: 'possibleBiases', label: 'BIASES', angle: 180, radius: 155 },
  { key: 'perspectives', label: 'PERSPECTIVES', angle: 225, radius: 175 },
] as const;

interface BlindSpotMapProps {
  counts: Record<string, number>;
  activeNode: string | null;
  onSelect: (key: string) => void;
}

export function BlindSpotMap({ counts, activeNode, onSelect }: BlindSpotMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const center = { x: 200, y: 200 };

  return (
    <div className="relative w-full aspect-square max-w-[440px] mx-auto">
      <svg viewBox="0 0 400 400" className="w-full h-full">
        {/* Background rings */}
        <circle cx={center.x} cy={center.y} r="200" fill="none" stroke="#27272a" strokeWidth="0.5" opacity="0.2" />
        <circle cx={center.x} cy={center.y} r="165" fill="none" stroke="#27272a" strokeWidth="0.5" opacity="0.15" />
        <circle cx={center.x} cy={center.y} r="115" fill="none" stroke="#27272a" strokeWidth="0.5" opacity="0.1" />

        {/* Connection lines */}
        {NODE_TYPES.map((node) => {
          const rad = (node.angle * Math.PI) / 180;
          const x = center.x + Math.cos(rad) * node.radius;
          const y = center.y + Math.sin(rad) * node.radius;
          const isActive = activeNode === node.key || hovered === node.key;
          return (
            <line
              key={`line-${node.key}`}
              x1={center.x}
              y1={center.y}
              x2={x}
              y2={y}
              stroke={isActive ? '#7dd3fc' : '#3f3f46'}
              strokeWidth={isActive ? 1 : 0.5}
              opacity={isActive ? 0.5 : 0.2}
              style={{ transition: 'all 0.3s ease' }}
            />
          );
        })}

        {/* Center node */}
        <g style={{ cursor: 'pointer' }} onClick={() => onSelect('')}>
          <circle
            cx={center.x}
            cy={center.y}
            r={activeNode === null ? 46 : 42}
            fill="#111113"
            stroke={activeNode === null ? '#7dd3fc' : '#3f3f46'}
            strokeWidth="1"
            style={{ transition: 'all 0.3s ease' }}
          />
          <circle cx={center.x} cy={center.y} r="46" fill="none" stroke="#7dd3fc" strokeWidth="0.3" opacity="0.2" className="animate-pulse-slow" />
          <text x={center.x} y={center.y - 5} textAnchor="middle" fill="#f4f4f5" style={{ fontSize: 7, fontWeight: 600, letterSpacing: '0.05em' }}>YOUR</text>
          <text x={center.x} y={center.y + 6} textAnchor="middle" fill="#f4f4f5" style={{ fontSize: 7, fontWeight: 600, letterSpacing: '0.05em' }}>DECISION</text>
        </g>

        {/* Orbital nodes */}
        {NODE_TYPES.map((node) => {
          const rad = (node.angle * Math.PI) / 180;
          const x = center.x + Math.cos(rad) * node.radius;
          const y = center.y + Math.sin(rad) * node.radius;
          const isActive = activeNode === node.key;
          const isHovered = hovered === node.key;
          const count = counts[node.key] || 0;
          const hasData = count > 0;

          return (
            <g
              key={node.key}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHovered(node.key)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelect(node.key)}
            >
              <circle
                cx={x}
                cy={y}
                r={isActive || isHovered ? 30 : 26}
                fill="#111113"
                stroke={isActive ? '#7dd3fc' : isHovered ? '#52525b' : '#3f3f46'}
                strokeWidth={isActive ? 1 : 0.8}
                style={{ transition: 'all 0.3s ease' }}
                opacity={hasData ? 1 : 0.4}
              />
              {(isActive || isHovered) && (
                <circle cx={x} cy={y} r="28" fill="none" stroke="#7dd3fc" strokeWidth="0.3" opacity="0.3" />
              )}
              <text
                x={x}
                y={y - 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={isActive ? '#7dd3fc' : isHovered ? '#f4f4f5' : '#a1a1aa'}
                style={{ fontSize: 5, fontWeight: 600, letterSpacing: '0.03em' }}
              >
                {node.label}
              </text>
              {hasData && (
                <text
                  x={x}
                  y={y + 8}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isActive ? '#7dd3fc' : '#52525b'}
                  style={{ fontSize: 7, fontWeight: 700 }}
                >
                  {count}
                </text>
              )}
            </g>
          );
        })}

        {/* Subtle floating particles */}
        {[...Array(5)].map((_, i) => {
          const angle = (i * 72 * Math.PI) / 180;
          const r = 90 + (i % 2) * 30;
          const px = center.x + Math.cos(angle) * r;
          const py = center.y + Math.sin(angle) * r;
          return (
            <circle
              key={`p-${i}`}
              cx={px}
              cy={py}
              r="1.2"
              fill="#7dd3fc"
              opacity="0.3"
              className="animate-pulse-slow"
              style={{ animationDelay: `${i * 0.4}s` }}
            />
          );
        })}
      </svg>
    </div>
  );
}

export { NODE_TYPES };
