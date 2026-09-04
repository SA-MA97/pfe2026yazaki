import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export default function SortableHeader({ label, sortKey, sortConfig, requestSort, align = 'left' }) {
  const isSorted = sortConfig && sortConfig.key === sortKey;
  const isAsc = isSorted && sortConfig.direction === 'ascending';

  return (
    <th 
      onClick={() => requestSort(sortKey)}
      style={{ 
        textAlign: align,
        whiteSpace: 'nowrap'
      }}
      className={`sortable-header${isSorted ? ' sorted' : ''}`}
      title={`Trier par ${label}`}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.3rem', 
        justifyContent: align === 'right' ? 'flex-end' : 'flex-start' 
      }}>
        <span>{label}</span>
        <span style={{ 
          display: 'inline-flex', 
          opacity: isSorted ? 1 : 0.35,
          color: isSorted ? 'var(--yazaki-red)' : 'inherit',
          flexShrink: 0
        }}>
          {isSorted ? (
            isAsc ? <ChevronUp size={13} /> : <ChevronDown size={13} />
          ) : (
            <ChevronsUpDown size={13} />
          )}
        </span>
      </div>
    </th>
  );
}
