import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

/**
 * Composant de Pagination universel pour YAZAKI TMS
 * Affiche : [<<] [<] [1] [2] ... [n] [>] [>>] + info "X à Y sur Z"
 */
export default function Pagination({ total, page, perPage, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  if (totalPages <= 1) return null;

  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);

  // Pages visibles autour de la page courante
  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
      range.push(i);
    }
    const withDots = [];
    if (range[0] > 1) {
      withDots.push(1);
      if (range[0] > 2) withDots.push('...');
    }
    range.forEach(p => withDots.push(p));
    if (range[range.length - 1] < totalPages) {
      if (range[range.length - 1] < totalPages - 1) withDots.push('...');
      withDots.push(totalPages);
    }
    return withDots;
  };

  return (
    <div className="pagination-bar">
      <span className="pagination-info">
        {start}–{end} sur <strong>{total}</strong>
      </span>

      <div className="pagination-controls">
        <button
          className="pag-btn"
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          title="Première page"
        >
          <ChevronsLeft size={14} />
        </button>
        <button
          className="pag-btn"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          title="Page précédente"
        >
          <ChevronLeft size={14} />
        </button>

        {getPageNumbers().map((p, i) =>
          p === '...'
            ? <span key={`dots-${i}`} className="pag-dots">…</span>
            : <button
                key={p}
                className={`pag-btn ${p === page ? 'pag-active' : ''}`}
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
        )}

        <button
          className="pag-btn"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          title="Page suivante"
        >
          <ChevronRight size={14} />
        </button>
        <button
          className="pag-btn"
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          title="Dernière page"
        >
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
}
