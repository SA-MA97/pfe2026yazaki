# Rapport Technique Complet — Frontend du Projet YAZAKI TMS
### Système de Gestion du Transport — PFE 2026

---

## 1. Vue d'Ensemble du Projet

Le projet **YAZAKI TMS (Transport Management System)** est une application web de supervision du transport du personnel pour l'usine **Yazaki Bizerte**. Il remplace les tableaux Excel par un tableau de bord numérique moderne et connecté à une vraie base de données PostgreSQL.

L'application permet à un responsable logistique de :
- Visualiser en temps réel les statistiques du transport
- Gérer les opérateurs, les bus, les stations, les shifts et les affectations
- Détecter et analyser les retards des bus
- Exporter des rapports PDF pour la direction

---

## 2. Technologies et Langages Utilisés

### Frontend
| Technologie | Version | Rôle |
|---|---|---|
| **React.js** | v18 | Framework principal pour construire l'interface |
| **Vite** | v5 | Outil de build et serveur de développement ultra-rapide |
| **JavaScript (ES2022)** | — | Langage de programmation principal |
| **JSX** | — | Syntaxe XML dans JavaScript pour décrire l'interface |
| **CSS Vanilla** | — | Styles personnalisés sans framework externe |
| **Lucide-React** | latest | Bibliothèque d'icônes SVG modernes |
| **Recharts** | latest | Graphiques interactifs (barres, lignes) |
| **React-Leaflet** | latest | Carte interactive OpenStreetMap |
| **jsPDF + jspdf-autotable** | latest | Génération de rapports PDF |

### Backend (connexion)
| Technologie | Rôle |
|---|---|
| **Node.js + Express.js** | Serveur API REST sur le port `5001` |
| **PostgreSQL** | Base de données relationnelle |
| **pg (node-postgres)** | Driver Node.js pour communiquer avec PostgreSQL |

---

## 3. Structure des Fichiers du Frontend

```
frontend/
└── src/
    ├── main.jsx               ← Point d'entrée de l'application
    ├── App.jsx                ← Composant racine (routage, thème, auth)
    ├── index.css              ← Système de design global (thèmes, variables, classes)
    ├── App.css                ← Styles de base de la mise en page
    │
    ├── components/
    │   ├── Sidebar.jsx        ← Menu de navigation latéral
    │   ├── Header.jsx         ← En-tête avec statut backend et thème
    │   ├── Toast.jsx          ← Système de notifications flottantes
    │   ├── EmptyState.jsx     ← Écran vide illustré
    │   ├── LoadingSpinner.jsx ← Spinner et lignes skeleton
    │   └── DeleteModal.jsx    ← Modale de confirmation de suppression
    │
    ├── views/
    │   ├── LoginView.jsx      ← Page de connexion
    │   ├── DashboardView.jsx  ← Tableau de bord avec KPIs et graphiques
    │   ├── OperatorsView.jsx  ← CRUD des opérateurs (D_Operateurs)
    │   ├── BusesView.jsx      ← CRUD des bus (D_Bus)
    │   ├── StationsView.jsx   ← CRUD des stations + carte interactive (D_Stations)
    │   ├── ShiftsView.jsx     ← CRUD des équipes horaires (D_Shifts)
    │   ├── AffectationsView.jsx ← CRUD des pointages (F_Affectations)
    │   └── DelaysView.jsx     ← Supervision retards + export PDF
    │
    └── utils/
        └── validate.js        ← Utilitaire de validation des formulaires
```

---

## 4. Architecture et Flux de Données

```
┌─────────────────────────────────────────────────────────┐
│                    NAVIGATEUR WEB                       │
│                 http://localhost:5173                    │
│                                                         │
│  ┌──────────────┐   ┌──────────────────────────────┐   │
│  │   Sidebar    │   │          main content        │   │
│  │  (navigation)│   │   (DashboardView, etc.)      │   │
│  │              │   │                              │   │
│  │  [Dashboard] │   │  useEffect(() => {           │   │
│  │  [Retards]   │   │    fetch('localhost:5001/    │   │
│  │  [Opérateurs]│   │    api/transport/...')       │   │
│  │  [Bus]       │   │  })                          │   │
│  │  [Stations]  │   │                              │   │
│  │  [Shifts]    │   └──────────────────────────────┘   │
│  │  [Affectation│                                       │
│  └──────────────┘                                       │
└─────────────────────────────────────┼───────────────────┘
                                      │ HTTP fetch (JSON)
                                      ▼
┌─────────────────────────────────────────────────────────┐
│                    BACKEND NODE.JS                      │
│                 http://localhost:5001                    │
│                                                         │
│  transportRoutes.js → transportController.js            │
│          → transportModel.js → PostgreSQL               │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Point d'Entrée — `main.jsx`

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

**Explication :** `main.jsx` est le **point de démarrage absolu** de l'application. Il utilise la méthode `createRoot` de React 18 pour "monter" le composant `App` dans l'élément HTML `<div id="root">` du fichier `index.html`. Le fichier `index.css` est importé ici pour être appliqué globalement. `StrictMode` active des avertissements supplémentaires pendant le développement.

---

## 6. Composant Racine — `App.jsx`

C'est le cerveau de l'application. Il gère :

### États globaux (useState)
```jsx
const [isAuthenticated, setIsAuthenticated] = useState(false); // Session login
const [activeTab, setActiveTab] = useState('dashboard');       // Page active
const [theme, setTheme] = useState('light');                   // Thème clair/sombre
const [isBackendOnline, setIsBackendOnline] = useState(false); // Statut API
const [stats, setStats] = useState({ operatorsCount: 0, busCount: 0 }); // KPIs
```

### Vérification du Backend au démarrage
```jsx
useEffect(() => {
  fetch('http://localhost:5001/api/transport/stats')
    .then(res => res.json())
    .then(data => { setIsBackendOnline(true); setStats(data); })
    .catch(() => setIsBackendOnline(false));
}, []);
```

Dès que l'application s'ouvre, React appelle `/api/transport/stats`. Si le backend répond → `isBackendOnline = true` et les statistiques réelles (nombre d'opérateurs, de bus) sont stockées et transmises au Dashboard.

### Routage sans React-Router
Le routage est géré manuellement via `activeTab` et un `switch-case` dans `renderActiveView()` :
```jsx
switch (activeTab) {
  case 'dashboard': return <DashboardView stats={stats} onNavigate={setActiveTab} />;
  case 'operators': return <OperatorsView />;
  case 'shifts':    return <ShiftsView />;
  // ...
}
```
Cliquer sur un item dans la `Sidebar` appelle `setActiveTab('operators')`, ce qui re-rend le composant correspondant.

### Thème clair/sombre
```jsx
<div className="app-layout" data-theme={theme}>
```
L'attribut `data-theme="dark"` active les variables CSS du mode sombre définies dans `index.css`.

---

## 7. Système de Design — `index.css`

Le fichier CSS fait **960+ lignes**. Il définit le système de design complet :

### Variables CSS (Tokens de Design)
```css
:root {
  --yazaki-red: #e60012;           /* Rouge officiel Yazaki */
  --yazaki-gradient: linear-gradient(135deg, #e60012, #ff3344);
  --bg-card: #ffffff;
  --text-main: #0f172a;
  --accent-blue: #2563eb;
  --accent-emerald: #059669;
  --accent-amber: #d97706;
  --font-sans: 'Plus Jakarta Sans', sans-serif;
  --radius-xl: 18px;
  --shadow-main: 0 4px 20px -2px rgba(15,23,42,0.06);
  --transition-fast: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

[data-theme="dark"] {
  --bg-dark: #0b0f19;
  --bg-card: rgba(17, 24, 39, 0.85);
  --text-main: #f9fafb;
}
```

### Classes réutilisables définies
- `.glass-card` — Carte avec glassmorphism et ombre
- `.btn-primary` — Bouton rouge Yazaki avec gradient
- `.btn-secondary` — Bouton neutre avec bordure
- `.custom-table` — Tableau stylisé avec hover effect
- `.badge-normal / badge-critical / badge-warning` — Étiquettes de statut colorées
- `.kpi-card` — Carte KPI avec effet hover (translateY)
- `.toast-item` — Notification flottante animée
- `.skeleton-cell` — Animation de chargement shimmer
- `.field-error` — Message d'erreur de validation rouge
- `.spinner` — Animation de chargement circulaire
- `.fadeSlideUp` — Animation d'apparition des composants

---

## 8. Composants Partagés

### `Toast.jsx` — Notifications Flottantes
```jsx
export function useToast() {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);
  return { toasts, addToast };
}
```
**Fonctionnement :** Le hook `useToast` retourne une fonction `addToast`. Chaque appel crée une notification avec un ID unique, l'ajoute à la liste, puis la supprime automatiquement après 3.5 secondes. Le composant `<ToastContainer>` affiche toutes les notifications en position fixe en haut à droite de l'écran.

### `DeleteModal.jsx` — Confirmation de Suppression
Remplace `window.confirm()` par une belle modale centrée avec icône d'alerte, description de l'élément à supprimer, et deux boutons Annuler / Confirmer. Reçoit les props : `isOpen`, `onConfirm`, `onCancel`, `itemName`.

### `EmptyState.jsx` — Écran Vide
Affiché quand un tableau n'a aucune donnée. Affiche une grande icône grise, un titre, une description et un bouton d'action optionnel.

### `LoadingSpinner.jsx` — Indicateurs de Chargement
- `LoadingSpinner` : spinner circulaire rouge Yazaki pour les listes de cartes
- `SkeletonRows` : lignes fantômes animées (effet shimmer) pour les tableaux

---

## 9. Détail de Chaque Vue

### 9.1 `LoginView.jsx`
Affichée avant authentification. Contient un formulaire email/mot de passe. Appelle `onLogin()` qui change `isAuthenticated` à `true` dans `App.jsx`.

### 9.2 `DashboardView.jsx` — Tableau de Bord
**Connexion API :**
```jsx
useEffect(() => {
  fetch('http://localhost:5001/api/transport/affectations')
    .then(r => r.json())
    .then(data => {
      const lates = data.filter(a => a.retard_minutes > 0);
      const critical = lates.filter(a => a.retard_minutes > 20);
      setCriticalCount(critical.length);
      setDelayList(lates.map(a => ({ ... })));
    });
}, []);
```
**Fonctionnalités :**
- 4 KPI Cards avec **compteurs animés** (`useAnimatedCount`) : opérateurs, bus, taux ponctualité, retard moyen
- Graphique Recharts `<BarChart>` des retards par équipe
- Tableau des derniers retards détectés
- Alerte rouge si des retards critiques (>20 min) existent
- Bouton "Voir Détails" navigue vers `DelaysView`

**Hook `useAnimatedCount` :**
```jsx
function useAnimatedCount(target, duration = 900) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target]);
  return count;
}
```

### 9.3 `OperatorsView.jsx` — Gestion des Opérateurs
**Tableau CRUD connecté à `D_Operateurs` :**

| Opération | Méthode HTTP | Endpoint |
|---|---|---|
| Lire tous | GET | `/api/transport/operators` |
| Ajouter | POST | `/api/transport/operators` |
| Supprimer | DELETE | `/api/transport/operators/:mat` |

**Validation appliquée :**
- Matricule : obligatoire, 2-20 chars, alphanumérique uniquement (regex `/^[a-zA-Z0-9_\-]+$/`)
- Nom Prénom : obligatoire, 3-80 chars, lettres uniquement (regex `/^[a-zA-ZÀ-ÿ\s\-']+$/`)

### 9.4 `BusesView.jsx` — Flotte des Bus
**Connecté à `D_Bus` :**

| Opération | Méthode HTTP | Endpoint |
|---|---|---|
| Lire tous | GET | `/api/transport/buses` |
| Ajouter | POST | `/api/transport/buses` |

Affichage en **grille de cartes** (cards-grid) avec le nombre d'arrêts associés.

### 9.5 `StationsView.jsx` — Stations avec Carte Interactive
**Connecté à `D_Stations` :**

| Opération | Méthode HTTP | Endpoint |
|---|---|---|
| Lire toutes | GET | `/api/transport/stations` |
| Ajouter | POST | `/api/transport/stations` |
| Modifier | PUT | `/api/transport/stations/:id` |
| Supprimer | DELETE | `/api/transport/stations/:id` |

**Particularités importantes :**
- Utilise `react-leaflet` avec fond de carte **CartoDB Voyager** (OpenStreetMap)
- Un **clic sur la carte** ouvre automatiquement la modale d'ajout avec les coordonnées GPS pré-remplies
- Les coordonnées sont converties en `parseFloat()` à la réception (PostgreSQL les renvoie en chaînes texte)
- Les marqueurs GPS utilisent un `L.divIcon()` personnalisé avec animation `pulseMarker`
- **Validation GPS :** Latitude entre 30-38, Longitude entre 7-12 (région de Bizerte, Tunisie)

### 9.6 `ShiftsView.jsx` — Équipes Horaires
**Connecté à `D_Shifts` :**

| Opération | Méthode HTTP | Endpoint |
|---|---|---|
| Lire tous | GET | `/api/transport/shifts` |
| Ajouter | POST | `/api/transport/shifts` |
| Modifier | PUT | `/api/transport/shifts/:id` |
| Supprimer | DELETE | `/api/transport/shifts/:id` |

**Logique des icônes et couleurs dynamiques :**
```jsx
function getShiftStyle(nomShift) {
  const n = nomShift?.toLowerCase() || '';
  if (n.includes('nuit'))  return { icon: Moon,   color: 'var(--accent-blue)' };
  if (n.includes('midi') || n.includes('soir')) 
                           return { icon: Sunset, color: 'var(--accent-amber)' };
  return                          { icon: Sun,    color: 'var(--yazaki-red)' };
}
```
Le nom du shift est analysé pour choisir l'icône (Lune/Coucher/Soleil) et la couleur (Bleu/Orange/Rouge).

### 9.7 `AffectationsView.jsx` — Journal des Pointages
**Connecté à `F_Affectations` (table de faits) :**

| Opération | Méthode HTTP | Endpoint |
|---|---|---|
| Lire toutes | GET | `/api/transport/affectations` |
| Ajouter | POST | `/api/transport/affectations` |
| Modifier | PUT | `/api/transport/affectations/:id` |
| Supprimer | DELETE | `/api/transport/affectations/:id` |

**Particularité :** Au chargement, cette vue fait **3 requêtes simultanées** avec `Promise.all` :
```jsx
Promise.all([
  fetch(`${API}/affectations`).then(r => r.json()),
  fetch(`${API}/stations`).then(r => r.json()),
  fetch(`${API}/shifts`).then(r => r.json()),
]).then(([affData, stData, shData]) => { ... });
```
Ceci permet de peupler les listes déroulantes avec les vraies stations et shifts de la base.

**Affichage du retard :** Le calcul `retard_minutes` est effectué **côté SQL** dans la requête PostgreSQL :
```sql
EXTRACT(EPOCH FROM (f.heure_arrivee - sh.heure_depart_prevue)) / 60 AS retard_minutes
```
Le frontend reçoit directement la valeur calculée et l'affiche avec un badge rouge (critique) ou vert (à l'heure).

### 9.8 `DelaysView.jsx` — Supervision des Retards + Export PDF
Filtre les affectations où `retard_minutes > 0` pour n'afficher que les incidents.

**Export PDF avec jsPDF :**
```jsx
const exportToPDF = () => {
  const doc = new jsPDF('landscape');
  doc.text('Rapport des Retards - YAZAKI', 14, 22);
  autoTable(doc, {
    head: [['Code', 'Date', 'Opérateur', 'Retard', ...]],
    body: filteredData.map(r => [`DEL-${r.id}`, r.date, ...]),
    headStyles: { fillColor: [230, 0, 18] } // Rouge Yazaki
  });
  doc.save('Yazaki_Rapport_Retards.pdf');
};
```

**Filtre double :** Barre de recherche textuelle ET filtre par niveau de gravité (Critique/Modéré/Mineur).

---

## 10. Utilitaire de Validation — `validate.js`

Ce fichier centralise **toutes les règles de validation** des formulaires de l'application.

```
validate.js
├── required(value, fieldName)      → Champ obligatoire
├── minLength(value, min, name)     → Longueur minimale
├── maxLength(value, max, name)     → Longueur maximale
├── onlyLetters(value, name)        → Regex : lettres + espaces uniquement
├── alphanumeric(value, name)       → Regex : alphanumérique sans espaces
├── validateLatitude(value)         → Entre 30 et 38 (Tunisie)
├── validateLongitude(value)        → Entre 7 et 12 (Tunisie)
├── validateTime(value, name)       → Format HH:MM
├── validateArrivalLogic(dep, arr)  → Écart max 4h entre shift et arrivée
├── validateForm(rules)             → Valide un objet entier de règles
└── isFormValid(errors)             → Retourne true si aucune erreur
```

**Utilisation dans un composant :**
```jsx
const errors = validateForm({
  mat: [required(mat, 'Le matricule'), alphanumeric(mat, 'Le matricule')],
  nom_prenom: [required(nom, 'Le nom'), onlyLetters(nom, 'Le nom')],
});
setFormErrors(errors);
if (!isFormValid(errors)) return; // Bloque l'envoi si erreurs
```

---

## 11. La Connexion Frontend ↔ Backend ↔ Base de Données

### Schéma complet du flux d'une requête

```
[Utilisateur clique "Ajouter Opérateur"]
          │
          ▼
[React: handleAddOperator()]
  → Validation locale (validate.js)
  → Si OK → fetch('http://localhost:5001/api/transport/operators', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ mat: 'M001', nom_prenom: 'Asma Garaja' })
             })
          │
          │ HTTP POST (JSON)
          ▼
[Express.js: transportRoutes.js]
  router.post('/operators', createOperator)
          │
          ▼
[transportController.js: createOperator()]
  const { mat, nom_prenom } = req.body;
  const result = await createOperatorDB(mat, nom_prenom);
  res.status(201).json(result);
          │
          ▼
[transportModel.js: createOperatorDB()]
  await pool.query(
    'INSERT INTO D_Operateurs (mat, nom_prenom) VALUES ($1, $2) RETURNING *',
    [mat, nom_prenom]
  );
          │
          ▼
[PostgreSQL: yazaki_db]
  Insertion dans la table D_Operateurs
  → Retourne la ligne insérée en JSON
          │
          │ Réponse HTTP 201 JSON
          ▼
[React: .then(data => { fetchOperators(); addToast('Ajouté !', 'success'); })]
  → Re-fetch de la liste → Mise à jour de l'interface
```

### Configuration de la connexion (backend)

**`.env` :**
```
DB_USER=postgres
DB_PASSWORD=asma
DB_DATABASE=yazaki_db
DB_HOST=localhost
DB_PORT=5432
PORT=5001
```

**`db.js` :**
```js
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: String(process.env.DB_PASSWORD),
  port: Number(process.env.DB_PORT),
});
```

### Tableau de toutes les API disponibles

| Méthode | URL | Description |
|---|---|---|
| GET | `/api/transport/stats` | Statistiques générales (dashboard) |
| GET | `/api/transport/operators` | Tous les opérateurs |
| POST | `/api/transport/operators` | Ajouter un opérateur |
| DELETE | `/api/transport/operators/:mat` | Supprimer par matricule |
| GET | `/api/transport/buses` | Tous les bus |
| POST | `/api/transport/buses` | Ajouter un bus |
| GET | `/api/transport/stations` | Toutes les stations |
| POST | `/api/transport/stations` | Ajouter une station |
| PUT | `/api/transport/stations/:id` | Modifier une station |
| DELETE | `/api/transport/stations/:id` | Supprimer une station |
| GET | `/api/transport/shifts` | Tous les shifts |
| POST | `/api/transport/shifts` | Ajouter un shift |
| PUT | `/api/transport/shifts/:id` | Modifier un shift |
| DELETE | `/api/transport/shifts/:id` | Supprimer un shift |
| GET | `/api/transport/affectations` | Toutes les affectations (avec retards SQL) |
| POST | `/api/transport/affectations` | Ajouter un pointage |
| PUT | `/api/transport/affectations/:id` | Modifier un pointage |
| DELETE | `/api/transport/affectations/:id` | Supprimer un pointage |

---

## 12. Modèle de Données (Base de Données PostgreSQL)

```
D_Bus                    D_Operateurs
┌─────────────┐          ┌───────────────────┐
│ id_bus (PK) │          │ mat (PK)          │
│ nom_bus     │          │ nom_prenom        │
└──────┬──────┘          └─────────┬─────────┘
       │                           │
       │ 1:N                       │ 1:N
       ▼                           ▼
D_Stations               F_Affectations
┌───────────────┐        ┌───────────────────────┐
│ id_station(PK)│◄───────│ id_affectation (PK)   │
│ id_bus (FK)   │        │ Date_Affectation       │
│ nom_station   │        │ mat (FK → D_Opérateurs)│
│ nom_region    │        │ id_station (FK)        │
│ latitude      │        │ id_shift (FK)          │
│ longitude     │        │ heure_arrivee          │
└───────────────┘        └───────────┬───────────┘
                                     │
                    D_Shifts         │
                    ┌──────────┐     │
                    │id_shift  │◄────┘
                    │nom_shift │
                    │heure_dep_│
                    │_prevue   │
                    └──────────┘
```

---

## 13. Récapitulatif des Travaux Réalisés

| Tâche | Détails |
|---|---|
| **Migration PostgreSQL** | Abandon de SQLite, configuration pg pool avec variables d'environnement |
| **Seed de données** | Injection de 8 stations Bizerte, 4 bus, 6 opérateurs, 6 shifts, 6 affectations |
| **Nettoyage Mock Data** | Suppression de toutes les fausses données statiques dans le frontend |
| **Dashboard dynamique** | Connexion aux API, compteurs animés, graphique Recharts temps réel |
| **CRUD Opérateurs** | Lecture, Ajout, Suppression avec Toast et DeleteModal |
| **CRUD Bus** | Lecture, Ajout avec EmptyState et Spinner |
| **CRUD Stations** | Lecture, Ajout, Modification, Suppression + Carte Leaflet interactive |
| **CRUD Shifts** | Lecture, Ajout, Modification, Suppression avec icônes dynamiques |
| **CRUD Affectations** | Lecture, Ajout, Modification, Suppression + Promise.all |
| **CRUD Retards** | Supervision filtrée, Modification, Suppression + Export PDF |
| **Composants UI** | Toast, EmptyState, LoadingSpinner/SkeletonRows, DeleteModal |
| **Validation formulaires** | 9 règles de validation dans validate.js, appliquées sur toutes les vues |
| **Mode Clair/Sombre** | Toggle complet via CSS variables et `data-theme` |
| **Export PDF** | jsPDF + autoTable avec en-tête rouge Yazaki |
| **Statut API** | Badge "Backend Connecté / Hors-ligne" dans le Header |
