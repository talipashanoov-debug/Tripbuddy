// Central Hebrew UI strings. Import as: import { t } from '../lib/strings'
// Category *values* stay English in the DB; only labels here are translated.
export const t = {
  brand: 'TripBuddy',

  auth: {
    welcomeBack: 'ברוך שובך',
    createAccount: 'יצירת חשבון',
    email: 'אימייל',
    password: 'סיסמה',
    signIn: 'התחברות',
    signUp: 'הרשמה',
    pleaseWait: 'רק רגע…',
    noAccount: 'אין לך חשבון? ',
    hasAccount: 'כבר יש לך חשבון? ',
    accountCreated: 'החשבון נוצר! אפשר להתחבר עכשיו (או לאשר את האימייל אם נדרש).',
  },

  nav: {
    logout: 'התנתקות',
  },

  dashboard: {
    yourTrips: 'הטיולים שלך',
    subtitle: 'לתכנן, לשתף ולחלק — הכול במקום אחד',
    createTrip: 'טיול חדש',
    emptyTitle: 'אין עדיין טיולים',
    emptyText: 'צרו את הטיול הראשון שלכם כדי להתחיל',
  },

  tripForm: {
    title: 'כותרת',
    destination: 'יעד',
    startDate: 'תאריך התחלה',
    endDate: 'תאריך סיום',
    cancel: 'ביטול',
    create: 'צור טיול',
    creating: 'יוצר…',
    heading: 'יצירת טיול חדש',
    dateError: 'תאריך הסיום לא יכול להיות לפני תאריך ההתחלה.',
  },

  trip: {
    back: 'חזרה ללוח הבקרה',
    notFoundTitle: 'הטיול לא נמצא או שאין הרשאה',
    notFoundText:
      'ייתכן שהטיול לא קיים, או שאינך חבר/ה בו. בקשו מאחד החברים להוסיף אתכם, או חזרו ללוח הבקרה.',
    loadError: 'אירעה שגיאה בטעינת הטיול.',
    tabItinerary: 'מסלול',
    tabExpenses: 'הוצאות',
  },

  itinerary: {
    heading: 'לוח זמנים יומי',
    add: 'הוסף פעילות',
    emptyTitle: 'לא תוכננו פעילויות',
    emptyText: 'הוסיפו את הפעילות הראשונה כדי לבנות את המסלול.',
    modalHeading: 'הוספת פעילות',
    title: 'כותרת',
    date: 'תאריך',
    startTime: 'שעת התחלה',
    location: 'מיקום',
    cancel: 'ביטול',
    save: 'הוסף פעילות',
    saving: 'מוסיף…',
    deleteAria: 'מחק פעילות',
  },

  expenses: {
    total: 'סך ההוצאות',
    add: 'הוסף הוצאה',
    emptyTitle: 'אין עדיין הוצאות',
    emptyText: 'הוסיפו את ההוצאה הראשונה כדי להתחיל לעקוב.',
    modalHeading: 'הוספת הוצאה',
    description: 'תיאור',
    amount: 'סכום',
    category: 'קטגוריה',
    paidBy: 'שולם על ידי',
    splitBetween: 'חלוקה בין',
    selectAll: 'בחר הכול',
    clearAll: 'נקה הכול',
    cancel: 'ביטול',
    save: 'הוסף הוצאה',
    saving: 'מוסיף…',
    deleteAria: 'מחק הוצאה',
    amountError: 'יש להזין סכום גדול מ-0.',
    payerError: 'יש לבחור מי שילם.',
    participantsError: 'יש לבחור לפחות משתתף אחד.',
    needParticipants: 'הוסיפו משתתפים לטיול לפני הוספת הוצאה.',
    splitInfo: 'מחולק בין',
  },

  settlement: {
    heading: 'תוכנית התחשבנות',
    calculate: 'חשב מי חייב למי',
    recalculate: 'חשב מחדש',
    calculating: 'מחשב…',
    intro: 'חלקו את כל ההוצאות ומצאו את מספר התשלומים המינימלי לסגירת החשבון.',
    settledUp: 'הכול מסודר — אין צורך בתשלומים!',
    owes: 'חייב/ת ל',
    summary: (count) => `מחולק בין ${count} משתתפים`,
  },

  members: {
    heading: 'חברי הטיול',
    invite: 'הזמנת חבר',
    inviteBtn: 'הזמן',
    inviting: 'מזמין…',
    placeholder: 'אימייל או מזהה משתמש',
    you: '(את/ה)',
    needsAccount: 'לאדם צריך להיות חשבון TripBuddy קיים.',
    already: (email) => `${email} כבר חבר/ה בטיול.`,
    added: (email) => `${email} נוסף/ה!`,
  },

  participants: {
    heading: 'משתתפים',
    add: 'הוסף',
    placeholder: 'שם המשתתף',
    empty: 'עדיין אין משתתפים. הוסיפו אנשים כדי לחלק ביניהם הוצאות.',
    deleteAria: 'מחק משתתף',
    inUse: 'לא ניתן למחוק משתתף שמופיע בהוצאה קיימת.',
  },

  startupError: {
    title: '🧳 TripBuddy נכשל בהפעלה',
    hint: 'בפריסה: ודאו ש-VITE_SUPABASE_URL ו-VITE_SUPABASE_ANON_KEY מוגדרים, ושביצעתם פריסה מחדש אחרי ההגדרה (Vite מטמיע אותם בזמן הבנייה).',
  },
}
