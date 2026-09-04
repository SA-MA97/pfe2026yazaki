import React, { createContext, useContext, useState, useEffect } from 'react';

// ============================================================
// YAZAKI TMS — Dictionnaire de Traductions (FR / AR / EN)
// ============================================================
const translations = {
  fr: {
    dir: 'ltr',
    // Sidebar
    mainMenu: 'Menu Principal',
    dashboard: 'Tableau de Bord',
    delays: 'Suivi des Retards',
    operators: 'Opérateurs',
    buses: 'Flotte de Bus',
    stations: 'Stations & Régions',
    shifts: 'Shifts & Horaires',
    affectations: 'Journal des Affectations',
    adminAccess: 'Accès Administrateur',
    logout: 'Déconnexion',
    brandSubtitle: 'Gestion Transport',
    // Header titles
    titleDashboard: 'Tableau de Bord Exécutif',
    titleDelays: 'Supervision & Analyse des Retards',
    titleOperators: 'Gestion des Opérateurs Yazaki',
    titleBuses: 'Flotte des Bus & Circuits',
    titleStations: 'Stations de Ramassage & Régions',
    titleShifts: 'Shifts & Planning Horaires',
    titleAffectations: 'Journal des Affectations et Pointages',
    // Status
    systemOnline: 'Système Connecté',
    systemOffline: 'Mode Hors-Ligne',
    supervisorName: 'Superviseur Yazaki',
    supervisorRole: 'Responsable Logistique',
    // Tooltips
    toggleDark: 'Passer en Mode Sombre',
    toggleLight: 'Passer en Mode Clair',
    refresh: 'Actualiser les données en temps réel',
    // Dashboard
    totalOperators: 'Opérateurs',
    totalBuses: 'Bus',
    totalStations: 'Stations',
    punctuality: 'Ponctualité',
    avgDelay: 'Retard Moyen',
    minutes: 'min',
    welcomeTitle: 'Bienvenue sur votre TMS',
    welcomeSub: 'Tableau de bord exécutif en temps réel',
    // Common actions
    add: 'Ajouter',
    edit: 'Modifier',
    delete: 'Supprimer',
    search: 'Rechercher...',
    save: 'Enregistrer',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    loading: 'Chargement...',
    noData: 'Aucune donnée disponible',
    actions: 'Actions',
    // Table columns
    registration: 'Matricule',
    fullName: 'Nom et Prénom',
    assignedBus: 'Bus Assigné',
    assignedStation: 'Station',
    busName: 'Nom du Bus',
    stationsCount: 'Stations',
    stationName: 'Nom de la Station',
    region: 'Région',
    shiftName: 'Nom du Shift',
    departureTime: 'Heure de Départ',
    period: 'Période',
    date: 'Date',
    operator: 'Opérateur',
    bus: 'Bus',
    shift: 'Shift',
    arrivalTime: 'Arrivée',
    delay: 'Retard',
    severity: 'Sévérité',
    latitude: 'Latitude',
    longitude: 'Longitude',
    // Severity levels
    critical: 'Critique',
    warning: 'Modéré',
    normal: 'Faible',
    // Sections
    addOperator: 'Ajouter un Opérateur',
    editOperator: 'Modifier un Opérateur',
    addBus: 'Ajouter un Bus',
    editBus: 'Modifier un Bus',
    addStation: 'Ajouter une Station',
    editStation: 'Modifier la Station',
    addShift: 'Ajouter un Shift',
    editShift: 'Modifier le Shift',
    addPointage: 'Nouveau Pointage',
    editPointage: 'Modifier le Pointage',
    // Delete modal
    confirmDeleteTitle: 'Confirmer la suppression',
    confirmDeleteMsg: 'Cette action est irréversible.',
    // Shifts period
    morning: 'Matin',
    afternoon: 'Après-midi',
    night: 'Nuit',
  },

  ar: {
    dir: 'rtl',
    // Sidebar
    mainMenu: 'القائمة الرئيسية',
    dashboard: 'لوحة التحكم',
    delays: 'متابعة التأخيرات',
    operators: 'المشغّلون',
    buses: 'أسطول الحافلات',
    stations: 'المحطات والمناطق',
    shifts: 'المناوبات والمواعيد',
    affectations: 'سجل التخصيصات',
    adminAccess: 'وصول المدير',
    logout: 'تسجيل الخروج',
    brandSubtitle: 'إدارة النقل',
    // Header titles
    titleDashboard: 'لوحة التحكم التنفيذية',
    titleDelays: 'مراقبة وتحليل التأخيرات',
    titleOperators: 'إدارة مشغّلي يازاكي',
    titleBuses: 'أسطول الحافلات والمسارات',
    titleStations: 'محطات الجمع والمناطق',
    titleShifts: 'المناوبات وجدول المواعيد',
    titleAffectations: 'سجل التخصيصات والحضور',
    // Status
    systemOnline: 'النظام متصل',
    systemOffline: 'وضع عدم الاتصال',
    supervisorName: 'مشرف يازاكي',
    supervisorRole: 'مسؤول اللوجستيك',
    // Tooltips
    toggleDark: 'التبديل إلى الوضع المظلم',
    toggleLight: 'التبديل إلى الوضع الفاتح',
    refresh: 'تحديث البيانات',
    // Dashboard
    totalOperators: 'المشغّلون',
    totalBuses: 'الحافلات',
    totalStations: 'المحطات',
    punctuality: 'الانضباط',
    avgDelay: 'متوسط التأخير',
    minutes: 'د',
    welcomeTitle: 'مرحباً بك في نظام TMS',
    welcomeSub: 'لوحة تحكم تنفيذية في الوقت الحقيقي',
    // Common actions
    add: 'إضافة',
    edit: 'تعديل',
    delete: 'حذف',
    search: 'بحث...',
    save: 'حفظ',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    loading: 'جارٍ التحميل...',
    noData: 'لا توجد بيانات',
    actions: 'الإجراءات',
    // Table columns
    registration: 'رقم التسجيل',
    fullName: 'الاسم الكامل',
    assignedBus: 'الحافلة المخصصة',
    assignedStation: 'المحطة',
    busName: 'اسم الحافلة',
    stationsCount: 'المحطات',
    stationName: 'اسم المحطة',
    region: 'المنطقة',
    shiftName: 'اسم المناوبة',
    departureTime: 'وقت الإقلاع',
    period: 'الفترة',
    date: 'التاريخ',
    operator: 'المشغّل',
    bus: 'الحافلة',
    shift: 'المناوبة',
    arrivalTime: 'وقت الوصول',
    delay: 'التأخير',
    severity: 'الخطورة',
    latitude: 'خط العرض',
    longitude: 'خط الطول',
    // Severity
    critical: 'حرج',
    warning: 'متوسط',
    normal: 'بسيط',
    // Sections
    addOperator: 'إضافة مشغّل',
    editOperator: 'تعديل مشغّل',
    addBus: 'إضافة حافلة',
    editBus: 'تعديل الحافلة',
    addStation: 'إضافة محطة',
    editStation: 'تعديل المحطة',
    addShift: 'إضافة مناوبة',
    editShift: 'تعديل المناوبة',
    addPointage: 'تسجيل حضور',
    editPointage: 'تعديل الحضور',
    // Delete modal
    confirmDeleteTitle: 'تأكيد الحذف',
    confirmDeleteMsg: 'هذا الإجراء لا يمكن التراجع عنه.',
    // Shifts period
    morning: 'صباح',
    afternoon: 'بعد الظهر',
    night: 'مساء',
  },

  en: {
    dir: 'ltr',
    // Sidebar
    mainMenu: 'Main Menu',
    dashboard: 'Dashboard',
    delays: 'Delays Tracking',
    operators: 'Operators',
    buses: 'Bus Fleet',
    stations: 'Stations & Regions',
    shifts: 'Shifts & Schedules',
    affectations: 'Assignments Journal',
    adminAccess: 'Administrator Access',
    logout: 'Sign Out',
    brandSubtitle: 'Transport Management',
    // Header titles
    titleDashboard: 'Executive Dashboard',
    titleDelays: 'Delays Supervision & Analysis',
    titleOperators: 'Yazaki Operators Management',
    titleBuses: 'Bus Fleet & Routes',
    titleStations: 'Pickup Stations & Regions',
    titleShifts: 'Shifts & Work Schedules',
    titleAffectations: 'Assignments & Attendance Journal',
    // Status
    systemOnline: 'System Online',
    systemOffline: 'Offline Mode',
    supervisorName: 'Yazaki Supervisor',
    supervisorRole: 'Logistics Manager',
    // Tooltips
    toggleDark: 'Switch to Dark Mode',
    toggleLight: 'Switch to Light Mode',
    refresh: 'Refresh real-time data',
    // Dashboard
    totalOperators: 'Operators',
    totalBuses: 'Buses',
    totalStations: 'Stations',
    punctuality: 'Punctuality',
    avgDelay: 'Avg. Delay',
    minutes: 'min',
    welcomeTitle: 'Welcome to your TMS',
    welcomeSub: 'Real-time executive dashboard',
    // Common actions
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    search: 'Search...',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    loading: 'Loading...',
    noData: 'No data available',
    actions: 'Actions',
    // Table columns
    registration: 'Registration',
    fullName: 'Full Name',
    assignedBus: 'Assigned Bus',
    assignedStation: 'Station',
    busName: 'Bus Name',
    stationsCount: 'Stations',
    stationName: 'Station Name',
    region: 'Region',
    shiftName: 'Shift Name',
    departureTime: 'Departure Time',
    period: 'Period',
    date: 'Date',
    operator: 'Operator',
    bus: 'Bus',
    shift: 'Shift',
    arrivalTime: 'Arrival Time',
    delay: 'Delay',
    severity: 'Severity',
    latitude: 'Latitude',
    longitude: 'Longitude',
    // Severity
    critical: 'Critical',
    warning: 'Moderate',
    normal: 'Low',
    // Sections
    addOperator: 'Add Operator',
    editOperator: 'Edit Operator',
    addBus: 'Add Bus',
    editBus: 'Edit Bus',
    addStation: 'Add Station',
    editStation: 'Edit Station',
    addShift: 'Add Shift',
    editShift: 'Edit Shift',
    addPointage: 'New Entry',
    editPointage: 'Edit Entry',
    // Delete modal
    confirmDeleteTitle: 'Confirm Deletion',
    confirmDeleteMsg: 'This action is irreversible.',
    // Shifts period
    morning: 'Morning',
    afternoon: 'Afternoon',
    night: 'Night',
  },
};

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('yz_lang') || 'fr');

  useEffect(() => {
    localStorage.setItem('yz_lang', lang);
    // Apply RTL/LTR direction at document level
    document.documentElement.dir = translations[lang].dir;
    document.documentElement.lang = lang;
  }, [lang]);

  const t = translations[lang];
  const cycleLang = () => {
    const order = ['fr', 'en', 'ar'];
    const next = order[(order.indexOf(lang) + 1) % order.length];
    setLang(next);
  };

  return (
    <LangContext.Provider value={{ lang, setLang, cycleLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
