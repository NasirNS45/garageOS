/**
 * Lightweight typed dictionary i18n. v1 scope: nav, jobs tab, job cards,
 * create-job form. Summary/History/Settings remain English (follow-up).
 */

export const en = {
  // Bottom nav
  "nav.jobs": "Jobs",
  "nav.history": "History",
  "nav.summary": "Summary",
  "nav.settings": "Settings",

  // Header / chrome
  "header.signOut": "Sign out",
  "banner.offline": "You are offline. Changes cannot be saved until the connection returns.",

  // Job statuses
  "status.pending": "Pending",
  "status.in_progress": "In Progress",
  "status.completed": "Completed",
  "status.cancelled": "Cancelled",
  "status.all": "All",

  // Job card actions
  "job.reviewComplete": "Review & Complete",
  "job.cancelQuestion": "Cancel this job?",
  "job.yesCancel": "Yes, cancel",
  "job.keep": "Keep",
  "job.viewInvoice": "View Invoice",
  "job.share": "Share",
  "job.copied": "Copied",
  "job.paid": "Paid",
  "job.markPaid": "Mark Paid",
  "job.liveTracking": "Live tracking page",
  "job.shareWithCustomer": "Share with customer",

  // Jobs tab
  "jobs.loadError.title": "Couldn't load job cards",
  "jobs.loadError.desc": "Check your connection and try again",
  "jobs.empty.title": "No job cards yet",
  "jobs.empty.desc": "Tap the + button to create your first job",
  "jobs.empty.action": "New Job Card",
  "jobs.filterEmpty.desc": "Switch to a different filter or create a new job",
  "jobs.loading": "Loading…",
  "jobs.loadMore": "Load more",
  "jobs.search": "Search plate, customer, or phone",
  "jobs.searchEmpty": "No jobs match your search",
  "stat.active": "Active",
  "stat.doneToday": "Done today",
  "stat.total": "Total",

  // Create job form
  "form.vehicleNumber": "Vehicle Number",
  "form.vehicleMake": "Vehicle Make",
  "form.customerName": "Customer Name",
  "form.customerPhone": "Customer Phone",
  "form.description": "Work Description",
  "form.notes": "Internal Notes",
  "form.labour": "Labour Charge (PKR)",
  "form.mechanic": "Assign Mechanic",
  "form.notifyCheckin": "Send WhatsApp check-in to customer",
  "form.submit": "Create Job Card",
  "form.saving": "Creating…",
} as const;

export type TKey = keyof typeof en;

export const ur: Record<TKey, string> = {
  "nav.jobs": "کام",
  "nav.history": "ہسٹری",
  "nav.summary": "خلاصہ",
  "nav.settings": "ترتیبات",

  "header.signOut": "سائن آؤٹ",
  "banner.offline": "آپ آف لائن ہیں۔ کنکشن واپس آنے تک تبدیلیاں محفوظ نہیں ہوں گی۔",

  "status.pending": "زیرِ التوا",
  "status.in_progress": "جاری ہے",
  "status.completed": "مکمل",
  "status.cancelled": "منسوخ",
  "status.all": "تمام",

  "job.reviewComplete": "جائزہ لیں اور مکمل کریں",
  "job.cancelQuestion": "یہ کام منسوخ کریں؟",
  "job.yesCancel": "ہاں، منسوخ کریں",
  "job.keep": "رکھیں",
  "job.viewInvoice": "انوائس دیکھیں",
  "job.share": "شیئر کریں",
  "job.copied": "کاپی ہو گیا",
  "job.paid": "ادا شدہ",
  "job.markPaid": "ادائیگی درج کریں",
  "job.liveTracking": "لائیو ٹریکنگ صفحہ",
  "job.shareWithCustomer": "کسٹمر کو بھیجیں",

  "jobs.loadError.title": "جاب کارڈ لوڈ نہیں ہو سکے",
  "jobs.loadError.desc": "اپنا کنکشن چیک کر کے دوبارہ کوشش کریں",
  "jobs.empty.title": "ابھی کوئی جاب کارڈ نہیں",
  "jobs.empty.desc": "پہلا کام بنانے کے لیے + بٹن دبائیں",
  "jobs.empty.action": "نیا جاب کارڈ",
  "jobs.filterEmpty.desc": "کوئی اور فلٹر منتخب کریں یا نیا کام بنائیں",
  "jobs.loading": "لوڈ ہو رہا ہے…",
  "jobs.loadMore": "مزید دکھائیں",
  "jobs.search": "نمبر، کسٹمر یا فون تلاش کریں",
  "jobs.searchEmpty": "کوئی کام آپ کی تلاش سے میل نہیں کھاتا",
  "stat.active": "جاری",
  "stat.doneToday": "آج مکمل",
  "stat.total": "کل",

  "form.vehicleNumber": "گاڑی کا نمبر",
  "form.vehicleMake": "گاڑی کی کمپنی",
  "form.customerName": "کسٹمر کا نام",
  "form.customerPhone": "کسٹمر کا فون",
  "form.description": "کام کی تفصیل",
  "form.notes": "اندرونی نوٹس",
  "form.labour": "مزدوری (PKR)",
  "form.mechanic": "مکینک منتخب کریں",
  "form.notifyCheckin": "کسٹمر کو واٹس ایپ پیغام بھیجیں",
  "form.submit": "جاب کارڈ بنائیں",
  "form.saving": "بن رہا ہے…",
};

export const DICTIONARIES = { en, ur } as const;
export type Language = keyof typeof DICTIONARIES;
