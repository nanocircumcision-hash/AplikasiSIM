import React from 'react';

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

/**
 * Deterministic SVG QR Matrix Generator
 * Generates an authentic, scan-aesthetic 2D matrix pattern with real corner finder patterns
 */
export const QRCodeGenerator: React.FC<QRCodeProps> = ({ value, size = 120, className = '' }) => {
  // Generate a deterministic 21x21 grid based on value string hash
  const gridSize = 21;
  const matrix: boolean[][] = Array(gridSize).fill(false).map(() => Array(gridSize).fill(false));

  // Add 3 corner finder patterns (7x7 outer, 3x3 inner square)
  const addFinder = (startX: number, startY: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 || // outer border
          (r >= 2 && r <= 4 && c >= 2 && c <= 4) // center solid
        ) {
          matrix[startY + r][startX + c] = true;
        } else {
          matrix[startY + r][startX + c] = false;
        }
      }
    }
  };

  addFinder(0, 0); // Top-left
  addFinder(gridSize - 7, 0); // Top-right
  addFinder(0, gridSize - 7); // Bottom-left

  // Timing patterns
  for (let i = 8; i < gridSize - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Hash value to populate remaining cells
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i);
    hash |= 0;
  }

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      // Don't overwrite finder patterns
      const inTL = r < 8 && c < 8;
      const inTR = r < 8 && c >= gridSize - 8;
      const inBL = r >= gridSize - 8 && c < 8;
      if (!inTL && !inTR && !inBL) {
        // Pseudo-random deterministic bit based on hash and position
        const seed = Math.sin(hash + r * 19 + c * 37) * 10000;
        matrix[r][c] = (seed - Math.floor(seed)) > 0.48;
      }
    }
  }

  const cellSize = size / (gridSize + 2); // 1-cell quiet zone

  return (
    <div className={`inline-block bg-white p-1 rounded border border-slate-200 shadow-xs ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width={size} height={size} fill="#ffffff" />
        <g transform={`translate(${cellSize}, ${cellSize})`}>
          {matrix.map((row, r) =>
            row.map((cell, c) =>
              cell ? (
                <rect
                  key={`${r}-${c}`}
                  x={c * cellSize}
                  y={r * cellSize}
                  width={cellSize + 0.2}
                  height={cellSize + 0.2}
                  fill="#0f172a"
                />
              ) : null
            )
          )}
        </g>
      </svg>
    </div>
  );
};
