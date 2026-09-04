import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title = 'Aucune donnée', description = 'Aucun enregistrement trouvé.', action = null }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={40} />
      </div>
      <h4 className="empty-state-title">{title}</h4>
      <p className="empty-state-desc">{description}</p>
      {action && (
        <button className="btn-primary" onClick={action.onClick} style={{ marginTop: '1rem' }}>
          {action.label}
        </button>
      )}
    </div>
  );
}
