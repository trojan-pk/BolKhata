export type LanguageCode = 'ur' | 'roman_ur' | 'en' | 'hi' | 'bn' | 'es';

export interface Translations {
  // Navigation Tabs
  home: string;
  customers: string;
  cashbook: string;
  reports: string;
  settings: string;
  voice: string;

  // Header & Store
  shopName: string;
  ownerName: string;
  contactNumber: string;

  // Dashboard Cards
  netLedgerBalance: string;
  overallStatus: string;
  receivable: string;
  payable: string;
  youWillCollect: string;
  youWillCollectSub: string;
  youWillPay: string;
  youWillPaySub: string;
  todayCashIn: string;
  todayCashOut: string;

  // Quick Actions & Home
  quickActions: string;
  addCustomer: string;
  addCustomerSub: string;
  recordCash: string;
  recordCashSub: string;
  viewReports: string;
  viewReportsSub: string;
  recentParties: string;
  viewAll: string;
  noPartiesYet: string;
  addFirstCustomer: string;
  allSettled: string;

  // Customers Screen & Cards
  searchPlaceholder: string;
  all: string;
  toReceive: string;
  toPay: string;
  advancePaid: string;
  udhaarPending: string;
  settledZero: string;
  call: string;
  reminder: string;
  youGave: string;
  youGot: string;
  addNewParty: string;
  customer: string;
  supplier: string;
  partyType: string;
  addressOptional: string;
  openingBalance: string;

  // Customer Detail Modal
  customerDetail: string;
  totalBalance: string;
  transactionHistory: string;
  noTransactionsYet: string;
  sendWhatsAppReminder: string;
  youGaveBtn: string;
  youGotBtn: string;

  // Transaction Modal
  youGaveTitle: string;
  youGotTitle: string;
  enterAmount: string;
  quickAdd: string;
  selectParty: string;
  itemDescriptionNote: string;
  paymentMode: string;
  cash: string;
  onlineBank: string;
  creditUdhaar: string;
  saveTransaction: string;
  cancel: string;

  // Cashbook
  dailyCashbook: string;
  cashbookSubtitle: string;
  cashInHand: string;
  addCashEntry: string;
  cashIn: string;
  cashOut: string;
  allEntries: string;
  inOnly: string;
  outOnly: string;
  entryType: string;
  category: string;
  sales: string;
  purchase: string;
  expense: string;
  other: string;

  // Reports
  reportsTitle: string;
  reportsSubtitle: string;
  downloadPdf: string;
  totalMarketUdhaar: string;
  totalSupplierPayable: string;
  topCustomersUdhaar: string;

  // Settings
  shopSettings: string;
  apiConnection: string;
  apiConnected: string;
  apiOffline: string;
  configure: string;
  storeDetails: string;
  currencyAndRegional: string;
  shopCurrency: string;
  appLanguage: string;
  saveSettings: string;
  signOut: string;
  settingsSavedSuccess: string;

  // Voice Assistant
  voiceTitle: string;
  voiceSubtitle: string;
  tapToSpeak: string;
  recordingTapToStop: string;
  processing: string;
  spokenPlaceholder: string;
  sampleCommandsTitle: string;
  parsedEntryReady: string;
  party: string;
  type: string;
  amount: string;
  confirmAndSave: string;
  udhaarGaveLabel: string;
  jamaGotLabel: string;
}

export const TRANSLATIONS: Record<LanguageCode, Translations> = {
  roman_ur: {
    home: 'Home',
    customers: 'Grahak / Khata',
    cashbook: 'Rokar (Cashbook)',
    reports: 'Reports',
    settings: 'Settings',
    voice: 'Bol Kar Likhein',

    shopName: 'Dukan / Karobar Ka Naam',
    ownerName: 'Malik Ka Naam',
    contactNumber: 'Mobile Number',

    netLedgerBalance: 'Kul Dukan Khata Baqi',
    overallStatus: 'Khata Status',
    receivable: '(Aap Lenge)',
    payable: '(Aap Denge)',
    youWillCollect: 'Aap Lenge',
    youWillCollectSub: 'Market se kul wasooli (Udhaar)',
    youWillPay: 'Aap Denge',
    youWillPaySub: 'Suppliers ko adaigi',
    todayCashIn: 'Aaj ki Cash Wasooli (In)',
    todayCashOut: 'Aaj ka Cash Kharch (Out)',

    quickActions: 'Fauri Actions',
    addCustomer: 'Naya Grahak Add Karein',
    addCustomerSub: 'Naya khata kholein',
    recordCash: 'Cash Entry Karein',
    recordCashSub: 'Roznamcha / Cashbook',
    viewReports: 'Khata Report Dekhein',
    viewReportsSub: 'PDF hisaab statement',
    recentParties: 'Recent Grahak / Khate',
    viewAll: 'Sab Dekhein',
    noPartiesYet: 'Abhi koi grahak mojood nahi hai',
    addFirstCustomer: 'Pehla grahak add karein',
    allSettled: 'Khata Barabar Hai (0)',

    searchPlaceholder: 'Grahak ka naam ya phone number dhoondein...',
    all: 'Tamam',
    toReceive: 'Lene Hain',
    toPay: 'Dene Hain',
    advancePaid: 'Advance Jama',
    udhaarPending: 'Udhaar Baqi',
    settledZero: 'Barabar (0)',
    call: 'Call',
    reminder: 'Reminder',
    youGave: 'Aap Ne Diya',
    youGot: 'Aap Ko Mila',
    addNewParty: 'Naya Grahak / Party Add Karein',
    customer: 'Grahak (Customer)',
    supplier: 'Supplier / Dealer',
    partyType: 'Khate Ki Qisam',
    addressOptional: 'Pata (Address - Ikhtiyari)',
    openingBalance: 'Purani Baqi Raqam (Opening Balance)',

    customerDetail: 'Grahak Ka Khata',
    totalBalance: 'Kul Baqi Raqam',
    transactionHistory: 'Len Den Ki History',
    noTransactionsYet: 'Abhi tak koi entry record nahi hui',
    sendWhatsAppReminder: 'WhatsApp Par Reminder Bhejein',
    youGaveBtn: '+ Aap Ne Diya (Udhaar)',
    youGotBtn: '+ Aap Ko Mila (Jama)',

    youGaveTitle: 'Aap Ne Diya (Udhaar Entry)',
    youGotTitle: 'Aap Ko Mila (Jama Wasooli)',
    enterAmount: 'Raqam darj karein',
    quickAdd: 'Fauri Raqam:',
    selectParty: 'Grahak / Party select karein',
    itemDescriptionNote: 'Samaan / Item ki tafseel likhein',
    paymentMode: 'Payment Ka Zariya',
    cash: 'Naqd (Cash)',
    onlineBank: 'Online / Bank / EasyPaisa',
    creditUdhaar: 'Udhaar Khata',
    saveTransaction: 'Entry Save Karein',
    cancel: 'Cancel Karein',

    dailyCashbook: 'Roznamcha / Cashbook',
    cashbookSubtitle: 'Dukan ki rozana cash amdan aur kharch ka hisaab',
    cashInHand: 'Kul Cash in Hand',
    addCashEntry: 'Nayi Cash Entry',
    cashIn: 'Cash Wasooli (In +)',
    cashOut: 'Cash Kharch (Out -)',
    allEntries: 'Tamam Entries',
    inOnly: 'Sirf Amdan (+)',
    outOnly: 'Sirf Kharch (-)',
    entryType: 'Entry Ki Qisam',
    category: 'Category / Mad',
    sales: 'Sale / Bikri',
    purchase: 'Kharidari / Maal',
    expense: 'Dukan Kharch',
    other: 'Deegar',

    reportsTitle: 'Karobari Khata Reports',
    reportsSubtitle: 'Kul udhaar, wasooli aur grahak balance ka khulasa',
    downloadPdf: 'PDF Report Download Karein',
    totalMarketUdhaar: 'Kul Market Udhaar (Aap Lenge)',
    totalSupplierPayable: 'Kul Supplier Baqi (Aap Denge)',
    topCustomersUdhaar: 'Top Udhaar Wale Grahak',

    shopSettings: 'Dukan Ki Settings',
    apiConnection: 'Node.js Express API Connection',
    apiConnected: 'Server se connect hai',
    apiOffline: 'Offline Local Mode',
    configure: 'Change Karein',
    storeDetails: 'Dukan Aur Karobar Ki Details',
    currencyAndRegional: 'Currency Aur Zaban',
    shopCurrency: 'Dukan Ki Currency',
    appLanguage: 'App Ki Zaban',
    saveSettings: 'Settings Save Karein',
    signOut: 'Sign Out',
    settingsSavedSuccess: 'Settings kamiyabi se save ho gayi!',

    voiceTitle: 'BolKhata Voice Assistant',
    voiceSubtitle: 'Bolein ya prompt select karein, khata khud save ho jayega',
    tapToSpeak: 'Bolne Ke Liye Mic Dabayein',
    recordingTapToStop: 'Recording ho rahi hai... Rokne ke liye dabayein',
    processing: 'Processing ho rahi hai...',
    spokenPlaceholder: 'Bola hua jumla yahan aayega...',
    sampleCommandsTitle: 'Fauri Sample Commands (1-Tap Test):',
    parsedEntryReady: 'Khata Entry Tayyar Hai:',
    party: 'Grahak:',
    type: 'Qisam:',
    amount: 'Raqam:',
    confirmAndSave: 'Tasdeeq Karein Aur Save Karein',
    udhaarGaveLabel: 'Aap Ne Diya (Udhaar)',
    jamaGotLabel: 'Aap Ko Mila (Jama)',
  },

  ur: {
    home: 'ہوم',
    customers: 'گاہک / کھاتہ',
    cashbook: 'نقد کھاتہ',
    reports: 'رپورٹس',
    settings: 'ترتیبات',
    voice: 'بول کر لکھیں',

    shopName: 'دکان / کاروبار کا نام',
    ownerName: 'مالک کا نام',
    contactNumber: 'رابطہ نمبر',

    netLedgerBalance: 'کل دکان کھاتہ بقایا',
    overallStatus: 'مجموعی صورتحال',
    receivable: '(وصول طلب)',
    payable: '(واجب الادا)',
    youWillCollect: 'آپ کو ملیں گے',
    youWillCollectSub: 'آپ لیں گے (ادھار)',
    youWillPay: 'آپ کو دینے ہیں',
    youWillPaySub: 'آپ دیں گے (جمع)',
    todayCashIn: 'آج کی نقد وصولی',
    todayCashOut: 'آج کا نقد خرچ',

    quickActions: 'فوری اقدامات',
    addCustomer: 'نیا گاہک شامل کریں',
    addCustomerSub: 'نیا کھاتہ کھولیں',
    recordCash: 'نقد انٹری کریں',
    recordCashSub: 'روزنامچہ / کیش بک',
    viewReports: 'کھاتہ رپورٹ دیکھیں',
    viewReportsSub: 'پی ڈی ایف اسٹیٹمنٹ',
    recentParties: 'حالیہ کھاتے دار / گاہک',
    viewAll: 'سب دیکھیں',
    noPartiesYet: 'ابھی کوئی گاہک موجود نہیں ہے',
    addFirstCustomer: 'پہلا گاہک شامل کریں',
    allSettled: 'کھاتہ برابر ہے',

    searchPlaceholder: 'گاہک کا نام یا فون نمبر تلاش کریں...',
    all: 'تمام',
    toReceive: 'لینے ہیں',
    toPay: 'دینے ہیں',
    advancePaid: 'پیشگی جمع',
    udhaarPending: 'ادھار باقی',
    settledZero: 'برابر (0)',
    call: 'کال',
    reminder: 'یاددہانی',
    youGave: 'آپ نے دیا',
    youGot: 'آپ کو ملا',
    addNewParty: 'نیا گاہک / پارٹی شامل کریں',
    customer: 'گاہک (کسٹمر)',
    supplier: 'سپلائر / ڈیلر',
    partyType: 'کھاتے کی قسم',
    addressOptional: 'پتہ (اختیاری)',
    openingBalance: 'ابتدائی بقایا رقم (اختیاری)',

    customerDetail: 'گاہک کا کھاتہ',
    totalBalance: 'کل بقایا رقم',
    transactionHistory: 'لین دین کی تفصیل (ہسٹری)',
    noTransactionsYet: 'ابھی تک کوئی لین دین ریکارڈ نہیں ہوا',
    sendWhatsAppReminder: 'واٹس ایپ پر یاددہانی بھیجیں',
    youGaveBtn: '+ آپ نے دیا (ادھار)',
    youGotBtn: '+ آپ کو ملا (جمع)',

    youGaveTitle: 'آپ نے دیا (ادھار)',
    youGotTitle: 'آپ کو ملا (وصولی / جمع)',
    enterAmount: 'رقم درج کریں',
    quickAdd: 'فوری رقم:',
    selectParty: 'گاہک / کھاتہ دار منتخب کریں',
    itemDescriptionNote: 'تفصیل / سامان کا نام لکھیں (اختیاری)',
    paymentMode: 'ادائیگی کا ذریعہ',
    cash: 'نقد (Cash)',
    onlineBank: 'آن لائن / بینک',
    creditUdhaar: 'ادھار کھاتہ',
    saveTransaction: 'لین دین محفوظ کریں',
    cancel: 'منسوخ کریں',

    dailyCashbook: 'روزنامچہ / نقد کیش بک',
    cashbookSubtitle: 'دکان کی روزانہ نقد آمدن اور اخراجات کا حساب',
    cashInHand: 'کل نقد رقم (کیش ان ہینڈ)',
    addCashEntry: 'نئی کیش انٹری',
    cashIn: 'نقد وصولی (ان)',
    cashOut: 'نقد خرچ (آؤٹ)',
    allEntries: 'تمام اندراج',
    inOnly: 'صرف آمدن (+)',
    outOnly: 'صرف خرچ (-)',
    entryType: 'انٹری کی قسم',
    category: 'کیٹیگری / مد',
    sales: 'سیل / بکری',
    purchase: 'خریداری / مال',
    expense: 'دکان خرچ',
    other: 'دیگر',

    reportsTitle: 'کاروباری کھاتہ رپورٹس',
    reportsSubtitle: 'کل ادھار، وصولیاں اور گاہکوں کے بیلنس کا خلاصہ',
    downloadPdf: 'پی ڈی ایف رپورٹ ڈاؤن لوڈ کریں',
    totalMarketUdhaar: 'کل مارکیٹ ادھار (وصول طلب)',
    totalSupplierPayable: 'کل واجب الادا رقم (سپلائر)',
    topCustomersUdhaar: 'سب سے زیادہ ادھار والے گاہک',

    shopSettings: 'دکان کی ترتیبات',
    apiConnection: 'Node.js Express API کنکشن',
    apiConnected: 'ایکسپریس سرور سے منسلک ہے',
    apiOffline: 'آف لائن لوکل موڈ',
    configure: 'تبدیل کریں',
    storeDetails: 'دکان و کاروبار کی تفصیلات',
    currencyAndRegional: 'کرنسی اور زبان کی ترتیبات',
    shopCurrency: 'دکان کی کرنسی',
    appLanguage: 'ایپ کی زبان',
    saveSettings: 'ترتیبات محفوظ کریں',
    signOut: 'لاگ آؤٹ کریں',
    settingsSavedSuccess: 'دکان کی ترتیبات کامیابی سے محفوظ ہو گئیں!',

    voiceTitle: 'بول کھاتہ وائس اسسٹنٹ',
    voiceSubtitle: 'بول کر کھاتہ لکھیں یا جملہ منتخب کریں (بول کر کھاتہ جوڑیں)',
    tapToSpeak: 'مائیک دبائیں اور بولیں',
    recordingTapToStop: 'ریکارڈنگ جاری ہے... روکنے کے لیے دبائیں',
    processing: 'پروسیسنگ جاری ہے...',
    spokenPlaceholder: 'بولا ہوا جملہ یہاں نظر آئے گا...',
    sampleCommandsTitle: 'نمونہ جملے آزمائیں:',
    parsedEntryReady: 'کھاتہ انٹری تیار ہے:',
    party: 'کھاتہ دار:',
    type: 'قسم:',
    amount: 'رقم:',
    confirmAndSave: 'تصدیق اور کھاتہ محفوظ کریں',
    udhaarGaveLabel: 'آپ نے دیا (ادھار)',
    jamaGotLabel: 'آپ کو ملا (جمع)',
  },

  en: {
    home: 'Home',
    customers: 'Customers',
    cashbook: 'Cashbook',
    reports: 'Reports',
    settings: 'Settings',
    voice: 'Voice Entry',

    shopName: 'Shop / Business Name',
    ownerName: 'Owner Name',
    contactNumber: 'Contact Number',

    netLedgerBalance: 'Net Ledger Balance',
    overallStatus: 'Overall Status',
    receivable: '(Receivable)',
    payable: '(Payable)',
    youWillCollect: 'You Will Collect',
    youWillCollectSub: 'Total credit given to customers',
    youWillPay: 'You Will Pay',
    youWillPaySub: 'Total payable to suppliers',
    todayCashIn: 'Today Cash In',
    todayCashOut: 'Today Cash Out',

    quickActions: 'Quick Actions',
    addCustomer: 'Add Customer',
    addCustomerSub: 'Open new ledger account',
    recordCash: 'Record Cash',
    recordCashSub: 'Daily cashbook entry',
    viewReports: 'View Reports',
    viewReportsSub: 'PDF ledger statements',
    recentParties: 'Recent Customer Ledgers',
    viewAll: 'View All',
    noPartiesYet: 'No customers added yet',
    addFirstCustomer: 'Add First Customer',
    allSettled: 'All accounts settled (0)',

    searchPlaceholder: 'Search customer name or mobile...',
    all: 'All',
    toReceive: 'To Collect',
    toPay: 'To Pay',
    advancePaid: 'Advance Paid',
    udhaarPending: 'Credit Due',
    settledZero: 'Settled (0)',
    call: 'Call',
    reminder: 'Reminder',
    youGave: 'You Gave',
    youGot: 'You Got',
    addNewParty: 'Add New Customer / Supplier',
    customer: 'Customer',
    supplier: 'Supplier / Dealer',
    partyType: 'Account Type',
    addressOptional: 'Address (Optional)',
    openingBalance: 'Opening Balance (Optional)',

    customerDetail: 'Customer Ledger Account',
    totalBalance: 'Net Balance Due',
    transactionHistory: 'Transaction History',
    noTransactionsYet: 'No transactions recorded yet',
    sendWhatsAppReminder: 'Send WhatsApp Reminder',
    youGaveBtn: '+ You Gave (Credit)',
    youGotBtn: '+ You Got (Payment)',

    youGaveTitle: 'You Gave (Credit Given)',
    youGotTitle: 'You Got (Payment Received)',
    enterAmount: 'Enter Amount',
    quickAdd: 'Quick Add:',
    selectParty: 'Select Customer / Supplier',
    itemDescriptionNote: 'Items / Notes (Optional)',
    paymentMode: 'Payment Method',
    cash: 'Cash',
    onlineBank: 'Online / Bank / UPI',
    creditUdhaar: 'Store Credit',
    saveTransaction: 'Save Transaction',
    cancel: 'Cancel',

    dailyCashbook: 'Daily Cashbook (Rokar)',
    cashbookSubtitle: 'Track your daily store cash inflow and expenses',
    cashInHand: 'Total Cash in Hand',
    addCashEntry: 'Add Cash Entry',
    cashIn: 'Cash In (+)',
    cashOut: 'Cash Out (-)',
    allEntries: 'All Entries',
    inOnly: 'Cash In Only',
    outOnly: 'Cash Out Only',
    entryType: 'Entry Type',
    category: 'Category',
    sales: 'Counter Sales',
    purchase: 'Inventory Purchase',
    expense: 'Shop Expenses',
    other: 'Other',

    reportsTitle: 'Business Reports',
    reportsSubtitle: 'Summary of customer balances and credit status',
    downloadPdf: 'Download PDF Statement',
    totalMarketUdhaar: 'Total Market Credit (Receivable)',
    totalSupplierPayable: 'Total Supplier Due (Payable)',
    topCustomersUdhaar: 'Top Due Customers',

    shopSettings: 'Shop Settings',
    apiConnection: 'Node.js Express API Connection',
    apiConnected: 'Connected to Express Server',
    apiOffline: 'Offline Local Mode',
    configure: 'Configure',
    storeDetails: 'Store & Business Profile',
    currencyAndRegional: 'Currency & Regional Settings',
    shopCurrency: 'Shop Currency',
    appLanguage: 'App Language',
    saveSettings: 'Save Settings',
    signOut: 'Sign Out',
    settingsSavedSuccess: 'Shop settings saved successfully!',

    voiceTitle: 'BolKhata Voice Assistant',
    voiceSubtitle: 'Speak or tap a command to auto-fill your ledger',
    tapToSpeak: 'Tap to Speak',
    recordingTapToStop: 'Recording... Tap to stop',
    processing: 'Processing speech...',
    spokenPlaceholder: 'Spoken phrase will appear here...',
    sampleCommandsTitle: 'Try sample voice commands:',
    parsedEntryReady: 'Parsed Entry Ready:',
    party: 'Party:',
    type: 'Type:',
    amount: 'Amount:',
    confirmAndSave: 'Confirm & Save to Ledger',
    udhaarGaveLabel: 'You Gave (Credit)',
    jamaGotLabel: 'You Got (Payment)',
  },

  hi: {
    home: 'होम',
    customers: 'ग्राहक / खाता',
    cashbook: 'रोकड़ (कैशबुक)',
    reports: 'रिपोर्ट्स',
    settings: 'सेटिंग्स',
    voice: 'बोल कर लिखें',

    shopName: 'दुकान / व्यापार का नाम',
    ownerName: 'मालिक का नाम',
    contactNumber: 'मोबाइल नंबर',

    netLedgerBalance: 'कुल दुकान खाता शेष',
    overallStatus: 'खाता स्थिति',
    receivable: '(आप लेंगे)',
    payable: '(आप देंगे)',
    youWillCollect: 'आपको मिलेंगे',
    youWillCollectSub: 'मार्केट से कुल वसूली (उधार)',
    youWillPay: 'आपको देने हैं',
    youWillPaySub: 'सप्लायर को भुगतान',
    todayCashIn: 'आज की नकद वसूली (इन)',
    todayCashOut: 'आज का नकद खर्च (आउट)',

    quickActions: 'त्वरित कार्य',
    addCustomer: 'नया ग्राहक जोड़ें',
    addCustomerSub: 'नया खाता खोलें',
    recordCash: 'कैश एंट्री करें',
    recordCashSub: 'दैनिक रोकड़ बही',
    viewReports: 'खाता रिपोर्ट देखें',
    viewReportsSub: 'पीडीएफ खाता विवरण',
    recentParties: 'हाल के ग्राहक खाते',
    viewAll: 'सभी देखें',
    noPartiesYet: 'अभी कोई ग्राहक नहीं है',
    addFirstCustomer: 'पहला ग्राहक जोड़ें',
    allSettled: 'खाता बराबर है (0)',

    searchPlaceholder: 'ग्राहक का नाम या फ़ोन नंबर खोजें...',
    all: 'सभी',
    toReceive: 'लेने हैं',
    toPay: 'देने हैं',
    advancePaid: 'अग्रिम जमा',
    udhaarPending: 'उधार बाकी',
    settledZero: 'बराबर (0)',
    call: 'कॉल',
    reminder: 'याद दिलाएं',
    youGave: 'आपने दिया',
    youGot: 'आपको मिला',
    addNewParty: 'नया ग्राहक / सप्लायर जोड़ें',
    customer: 'ग्राहक (Customer)',
    supplier: 'सप्लायर / डीलर',
    partyType: 'खाते का प्रकार',
    addressOptional: 'पता (वैकल्पिक)',
    openingBalance: 'पुरानी बाकी राशि (Opening Balance)',

    customerDetail: 'ग्राहक का खाता',
    totalBalance: 'कुल बाकी राशि',
    transactionHistory: 'लेन-देन इतिहास',
    noTransactionsYet: 'अभी तक कोई लेन-देन दर्ज नहीं है',
    sendWhatsAppReminder: 'व्हाट्सएप पर रिमाइंडर भेजें',
    youGaveBtn: '+ आपने दिया (उधार)',
    youGotBtn: '+ आपको मिला (जमा)',

    youGaveTitle: 'आपने दिया (उधार एंट्री)',
    youGotTitle: 'आपको मिला (जमा वसूली)',
    enterAmount: 'राशि दर्ज करें',
    quickAdd: 'त्वरित राशि:',
    selectParty: 'ग्राहक / पार्टी चुनें',
    itemDescriptionNote: 'सामान / विवरण लिखें (वैकल्पिक)',
    paymentMode: 'भुगतान का माध्यम',
    cash: 'नकद (Cash)',
    onlineBank: 'ऑनलाइन / बैंक / UPI',
    creditUdhaar: 'उधार खाता',
    saveTransaction: 'लेन-देन सहेजें',
    cancel: 'रद्द करें',

    dailyCashbook: 'दैनिक रोकड़ (Cashbook)',
    cashbookSubtitle: 'दुकान की दैनिक आय और खर्च का हिसाब',
    cashInHand: 'कुल नकद राशि (Cash in Hand)',
    addCashEntry: 'नयी कैश एंट्री',
    cashIn: 'नकद आया (+)',
    cashOut: 'नकद गया (-)',
    allEntries: 'सभी प्रविष्टियां',
    inOnly: 'केवल आय (+)',
    outOnly: 'केवल खर्च (-)',
    entryType: 'एंट्री का प्रकार',
    category: 'श्रेणी / मद',
    sales: 'दुकान बिक्री',
    purchase: 'माल खरीदारी',
    expense: 'दुकान खर्च',
    other: 'अन्य',

    reportsTitle: 'व्यापार रिपोर्ट',
    reportsSubtitle: 'कुल उधार, वसूली और ग्राहक बैलेंस का सारांश',
    downloadPdf: 'पीडीएफ रिपोर्ट डाउनलोड करें',
    totalMarketUdhaar: 'कुल बाजार उधार (लेना है)',
    totalSupplierPayable: 'कुल सप्लायर बकाया (देना है)',
    topCustomersUdhaar: 'सबसे अधिक उधार वाले ग्राहक',

    shopSettings: 'दुकान की सेटिंग्स',
    apiConnection: 'Node.js Express API कनेक्शन',
    apiConnected: 'सर्वर से जुड़ा हुआ है',
    apiOffline: 'ऑफ़लाइन लोकल मोड',
    configure: 'बदलें',
    storeDetails: 'दुकान और व्यापार विवरण',
    currencyAndRegional: 'मुद्रा और क्षेत्रीय सेटिंग्स',
    shopCurrency: 'दुकान की मुद्रा',
    appLanguage: 'ऐप की भाषा',
    saveSettings: 'सेटिंग्स सहेजें',
    signOut: 'साइन आउट',
    settingsSavedSuccess: 'सेटिंग्स सफलतापूर्वक सहेजी गईं!',

    voiceTitle: 'बोलखाता वॉइस असिस्टेंट',
    voiceSubtitle: 'बोलकर खाता लिखें या सैंपल चुनें',
    tapToSpeak: 'बोलने के लिए माइक दबाएं',
    recordingTapToStop: 'रिकॉर्डिंग जारी है... रोकने के लिए दबाएं',
    processing: 'प्रोसेसिंग हो रही है...',
    spokenPlaceholder: 'बोला गया वाक्य यहाँ दिखाई देगा...',
    sampleCommandsTitle: 'नमूना वाक्य आज़माएं:',
    parsedEntryReady: 'खाता एंट्री तैयार है:',
    party: 'पार्टी:',
    type: 'प्रकार:',
    amount: 'राशि:',
    confirmAndSave: 'पुष्टि करें और खाता सहेजें',
    udhaarGaveLabel: 'आपने दिया (उधार)',
    jamaGotLabel: 'आपको मिला (जमा)',
  },

  bn: {
    home: 'হোম',
    customers: 'গ্রাহক / খাতা',
    cashbook: 'নগদ ক্যাশবই',
    reports: 'রিপোর্ট',
    settings: 'সেটিংস',
    voice: 'ভয়েস এন্ট্রি',

    shopName: 'দোকান / ব্যবসার নাম',
    ownerName: 'মালিকের নাম',
    contactNumber: 'যোগাযোগ নম্বর',

    netLedgerBalance: 'মোট বকেয়া স্থিতি',
    overallStatus: 'সার্বিক অবস্থা',
    receivable: '(পাবেন)',
    payable: '(দেবেন)',
    youWillCollect: 'আপনি পাবেন',
    youWillCollectSub: 'মোট বাকি বা ঋণ',
    youWillPay: 'আপনি দেবেন',
    youWillPaySub: 'সরবরাহকারীদের প্রদেয়',
    todayCashIn: 'আজকের নগদ গ্রহণ',
    todayCashOut: 'আজকের নগদ খরচ',

    quickActions: 'দ্রুত কর্ম',
    addCustomer: 'নতুন গ্রাহক যোগ করুন',
    addCustomerSub: 'নতুন খাতা খুলুন',
    recordCash: 'নগদ এন্ট্রি করুন',
    recordCashSub: 'দৈনিক ক্যাশবই',
    viewReports: 'খাতা রিপোর্ট দেখুন',
    viewReportsSub: 'পিডিএফ বিবরণী',
    recentParties: 'সাম্প্রতিক খাতা',
    viewAll: 'সব দেখুন',
    noPartiesYet: 'এখনও কোনো গ্রাহক নেই',
    addFirstCustomer: 'প্রথম গ্রাহক যোগ করুন',
    allSettled: 'সব হিসাব পরিশোধিত (০)',

    searchPlaceholder: 'গ্রাহকের নাম বা ফোন নম্বর খুঁজুন...',
    all: 'সব',
    toReceive: 'পাবেন',
    toPay: 'দেবেন',
    advancePaid: 'অগ্রিম জমা',
    udhaarPending: 'বাকি ঋণ',
    settledZero: 'পরিশোধিত (০)',
    call: 'কল',
    reminder: 'স্মরণ করান',
    youGave: 'আপনি দিলেন',
    youGot: 'আপনি পেলেন',
    addNewParty: 'নতুন পার্টি যোগ করুন',
    customer: 'গ্রাহক (Customer)',
    supplier: 'সরবরাহকারী (Supplier)',
    partyType: 'হিসাবের ধরন',
    addressOptional: 'ঠিকানা (ঐচ্ছিক)',
    openingBalance: 'প্রারম্ভিক ব্যালেন্স (ঐচ্ছিক)',

    customerDetail: 'গ্রাহক খাতা বিবরণ',
    totalBalance: 'মোট বকেয়া',
    transactionHistory: 'লেনদেনের ইতিহাস',
    noTransactionsYet: 'কোনো লেনদেন রেকর্ড হয়নি',
    sendWhatsAppReminder: 'হোয়াটসঅ্যাপ রিমাইন্ডার পাঠান',
    youGaveBtn: '+ আপনি দিলেন (বাকি)',
    youGotBtn: '+ আপনি পেলেন (জমা)',

    youGaveTitle: 'আপনি দিলেন (বাকি বিক্রয়)',
    youGotTitle: 'আপনি পেলেন (নগদ গ্রহণ)',
    enterAmount: 'পরিমাণ লিখুন',
    quickAdd: 'দ্রুত যোগ:',
    selectParty: 'গ্রাহক নির্বাচন করুন',
    itemDescriptionNote: 'বিবরণ লিখুন (ঐচ্ছিক)',
    paymentMode: 'পেমেন্টের মাধ্যম',
    cash: 'নগদ (Cash)',
    onlineBank: 'অনলাইন / ব্যাংক',
    creditUdhaar: 'বাকি খাতা',
    saveTransaction: 'লেনদেন সংরক্ষণ করুন',
    cancel: 'বাতিল',

    dailyCashbook: 'দৈনিক ক্যাশবই (রোজকনামচা)',
    cashbookSubtitle: 'দৈনিক নগদ আয় ও ব্যয়ের হিসাব রাখুন',
    cashInHand: 'হাতে মোট নগদ টাকা',
    addCashEntry: 'নতুন ক্যাশ এন্ট্রি',
    cashIn: 'নগদ জমা (+)',
    cashOut: 'নগদ খরচ (-)',
    allEntries: 'সব এন্ট্রি',
    inOnly: 'শুধু আয়',
    outOnly: 'শুধু খরচ',
    entryType: 'এন্ট্রির ধরন',
    category: 'বিভাগ',
    sales: 'বিক্রয়',
    purchase: 'ক্রয় / মালামাল',
    expense: 'দোকান খরচ',
    other: 'অন্যান্য',

    reportsTitle: 'ব্যবসায়িক রিপোর্ট',
    reportsSubtitle: 'মোট বাকি, আদায় ও গ্রাহকদের ব্যালেন্সের সারাংশ',
    downloadPdf: 'পিডিএফ রিপোর্ট ডাউনলোড করুন',
    totalMarketUdhaar: 'মোট পাওনা টাকা',
    totalSupplierPayable: 'মোট দেনা টাকা',
    topCustomersUdhaar: 'সর্বোচ্চ বাকি গ্রাহকগণ',

    shopSettings: 'দোকানের সেটিংস',
    apiConnection: 'Express API সংযোগ',
    apiConnected: 'সার্ভার সংযুক্ত',
    apiOffline: 'অফলাইন মোড',
    configure: 'পরিবর্তন',
    storeDetails: 'দোকান প্রোফাইল',
    currencyAndRegional: 'মুদ্রা ও ভাষা',
    shopCurrency: 'মুদ্রা',
    appLanguage: 'অ্যাপের ভাষা',
    saveSettings: 'সেটিংস সংরক্ষণ করুন',
    signOut: 'সাইন আউট',
    settingsSavedSuccess: 'সেটিংস সফলভাবে সংরক্ষিত হয়েছে!',

    voiceTitle: 'বোলখাতা ভয়েস সহকারী',
    voiceSubtitle: 'মুখে বলুন খাতা স্বয়ংক্রিয়ভাবে সেভ হবে',
    tapToSpeak: 'কথা বলতে ট্যাপ করুন',
    recordingTapToStop: 'রেকর্ডিং হচ্ছে... থামাতে ট্যাপ করুন',
    processing: 'প্রক্রিয়াকরণ হচ্ছে...',
    spokenPlaceholder: 'উচ্চারিত বাক্য এখানে দেখা যাবে...',
    sampleCommandsTitle: 'নমুনা ভয়েস কমান্ড:',
    parsedEntryReady: 'এন্ট্রি প্রস্তুত:',
    party: 'পার্টি:',
    type: 'ধরন:',
    amount: 'পরিমাণ:',
    confirmAndSave: 'নিশ্চিত করুন এবং সেভ করুন',
    udhaarGaveLabel: 'আপনি দিলেন (বাকি)',
    jamaGotLabel: 'আপনি পেলেন (জমা)',
  },

  es: {
    home: 'Inicio',
    customers: 'Clientes',
    cashbook: 'Libro de Caja',
    reports: 'Reportes',
    settings: 'Ajustes',
    voice: 'Voz a Texto',

    shopName: 'Nombre del Negocio',
    ownerName: 'Nombre del Dueño',
    contactNumber: 'Teléfono',

    netLedgerBalance: 'Saldo Neto Total',
    overallStatus: 'Estado General',
    receivable: '(Por Cobrar)',
    payable: '(Por Pagar)',
    youWillCollect: 'Por Cobrar',
    youWillCollectSub: 'Créditos otorgados a clientes',
    youWillPay: 'Por Pagar',
    youWillPaySub: 'Deudas con proveedores',
    todayCashIn: 'Ingreso de Caja Hoy',
    todayCashOut: 'Egreso de Caja Hoy',

    quickActions: 'Acciones Rápidas',
    addCustomer: 'Nuevo Cliente',
    addCustomerSub: 'Abrir nueva cuenta de crédito',
    recordCash: 'Registrar Caja',
    recordCashSub: 'Entrada/Salida de efectivo',
    viewReports: 'Ver Reportes',
    viewReportsSub: 'Estados de cuenta PDF',
    recentParties: 'Cuentas Recientes',
    viewAll: 'Ver Todos',
    noPartiesYet: 'Aún no hay clientes registrados',
    addFirstCustomer: 'Agregar Primer Cliente',
    allSettled: 'Cuentas saldadas (0)',

    searchPlaceholder: 'Buscar por nombre o teléfono...',
    all: 'Todos',
    toReceive: 'Por Cobrar',
    toPay: 'Por Pagar',
    advancePaid: 'Anticipos',
    udhaarPending: 'Crédito Pendiente',
    settledZero: 'Saldado (0)',
    call: 'Llamar',
    reminder: 'Recordar',
    youGave: 'Entregó',
    youGot: 'Recibió',
    addNewParty: 'Agregar Cliente / Proveedor',
    customer: 'Cliente',
    supplier: 'Proveedor',
    partyType: 'Tipo de Cuenta',
    addressOptional: 'Dirección (Opcional)',
    openingBalance: 'Saldo Inicial (Opcional)',

    customerDetail: 'Detalle de Cuenta',
    totalBalance: 'Saldo Pendiente',
    transactionHistory: 'Historial de Movimientos',
    noTransactionsYet: 'Sin movimientos registrados',
    sendWhatsAppReminder: 'Enviar Recordatorio WhatsApp',
    youGaveBtn: '+ Entregó (Crédito)',
    youGotBtn: '+ Recibió (Pago)',

    youGaveTitle: 'Entregó (Crédito)',
    youGotTitle: 'Recibió (Abono / Pago)',
    enterAmount: 'Ingrese el monto',
    quickAdd: 'Monto Rápido:',
    selectParty: 'Seleccionar Cliente',
    itemDescriptionNote: 'Detalle o producto (Opcional)',
    paymentMode: 'Método de Pago',
    cash: 'Efectivo',
    onlineBank: 'Transferencia / Banco',
    creditUdhaar: 'Crédito en Cuenta',
    saveTransaction: 'Guardar Movimiento',
    cancel: 'Cancelar',

    dailyCashbook: 'Libro Diario de Caja',
    cashbookSubtitle: 'Control diario de entradas y salidas de efectivo',
    cashInHand: 'Total Efectivo en Caja',
    addCashEntry: 'Nuevo Movimiento',
    cashIn: 'Entrada (+)',
    cashOut: 'Salida (-)',
    allEntries: 'Todos los Movimientos',
    inOnly: 'Solo Entradas',
    outOnly: 'Solo Salidas',
    entryType: 'Tipo de Movimiento',
    category: 'Categoría',
    sales: 'Ventas del Día',
    purchase: 'Compra de Mercadería',
    expense: 'Gastos del Local',
    other: 'Otros',

    reportsTitle: 'Reportes y Balances',
    reportsSubtitle: 'Resumen de cobros y pagos pendientes',
    downloadPdf: 'Descargar Reporte PDF',
    totalMarketUdhaar: 'Total por Cobrar',
    totalSupplierPayable: 'Total por Pagar a Proveedores',
    topCustomersUdhaar: 'Principales Deudores',

    shopSettings: 'Ajustes del Negocio',
    apiConnection: 'Conexión Node.js Express API',
    apiConnected: 'Conectado al Servidor Express',
    apiOffline: 'Modo Local Desconectado',
    configure: 'Configurar',
    storeDetails: 'Detalles del Negocio',
    currencyAndRegional: 'Moneda e Idioma',
    shopCurrency: 'Moneda',
    appLanguage: 'Idioma de la App',
    saveSettings: 'Guardar Ajustes',
    signOut: 'Cerrar Sesión',
    settingsSavedSuccess: '¡Ajustes guardados con éxito!',

    voiceTitle: 'Asistente de Voz BolKhata',
    voiceSubtitle: 'Hable o toque una frase para registrar',
    tapToSpeak: 'Tocar y Hablar',
    recordingTapToStop: 'Grabando... Toque para detener',
    processing: 'Procesando...',
    spokenPlaceholder: 'La frase aparecerá aquí...',
    sampleCommandsTitle: 'Ejemplos de frases:',
    parsedEntryReady: 'Entrada Lista:',
    party: 'Cliente:',
    type: 'Tipo:',
    amount: 'Monto:',
    confirmAndSave: 'Confirmar y Guardar',
    udhaarGaveLabel: 'Entregó (Crédito)',
    jamaGotLabel: 'Recibió (Pago)',
  },
};

export const getTranslation = (lang?: LanguageCode | string): Translations => {
  if (lang && lang in TRANSLATIONS) {
    return TRANSLATIONS[lang as LanguageCode];
  }
  return TRANSLATIONS.roman_ur; // Default to Roman Urdu
};
