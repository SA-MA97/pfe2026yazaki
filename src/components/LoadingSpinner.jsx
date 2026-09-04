import React from 'react';

export default function LoadingSpinner({ text = 'Chargement...' }) {
  return (
    <div className="loading-state">
      <div className="spinner" />
      <span className="loading-text">{text}</span>
    </div>
  );
}

// Skeleton row for tables
export function SkeletonRows({ cols = 5, rows = 4 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="skeleton-row">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j}><div className="skeleton-cell" /></td>
          ))}
        </tr>
      ))}
    </>
  );
}
