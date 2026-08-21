export type LanguageCode = 'ur' | 'en' | 'hi' | 'bn' | 'es';

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

  // Cashbook Screen
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

  // Reports Screen
  reportsTitle: string;
  reportsSubtitle: string;
  downloadPdf: string;
  totalMarketUdhaar: string;
  totalSupplierPayable: string;
  topCustomersUdhaar: string;

  // Settings Screen
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

  // Voice Assistant Modal
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

    netLedgerBalance: 'Net Shop Ledger Balance',
    overallStatus: 'Overall Status',
    receivable: '(Receivable)',
    payable: '(Payable)',
    youWillCollect: 'You Will Collect',
    youWillCollectSub: 'You gave (Udhaar)',
    youWillPay: 'You Will Pay',
    youWillPaySub: 'You got (Jama)',
    todayCashIn: "Today's Cash In",
    todayCashOut: "Today's Cash Out",

    quickActions: 'Quick Actions',
    addCustomer: 'Add Customer',
    addCustomerSub: 'Open new ledger account',
    recordCash: 'Record Cash Entry',
    recordCashSub: 'Daily cashbook log',
    viewReports: 'View Reports',
    viewReportsSub: 'PDF & statement view',
    recentParties: 'Recent Customer Accounts',
    viewAll: 'View All',
    noPartiesYet: 'No customer accounts yet',
    addFirstCustomer: 'Add First Customer',
    allSettled: 'All Settled',

    searchPlaceholder: 'Search customer name or phone...',
    all: 'All',
    toReceive: 'To Collect',
    toPay: 'To Pay',
    advancePaid: 'Advance Paid',
    udhaarPending: 'Udhaar Pending',
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

    customerDetail: 'Customer Ledger Details',
    totalBalance: 'Total Outstanding Balance',
    transactionHistory: 'Transaction History',
    noTransactionsYet: 'No transactions recorded yet',
    sendWhatsAppReminder: 'Send WhatsApp Reminder',
    youGaveBtn: '+ YOU GAVE (Udhaar)',
    youGotBtn: '+ YOU GOT (Payment)',

    youGaveTitle: 'You Gave (Udhaar / Credit)',
    youGotTitle: 'You Got (Payment / Jama)',
    enterAmount: 'Enter Amount',
    quickAdd: 'Quick Add:',
    selectParty: 'Select Customer Account',
    itemDescriptionNote: 'Item description / note (optional)',
    paymentMode: 'Payment Mode',
    cash: 'Cash',
    onlineBank: 'Bank / Online',
    creditUdhaar: 'Ledger Credit',
    saveTransaction: 'Save Transaction',
    cancel: 'Cancel',

    dailyCashbook: 'Daily Cashbook',
    cashbookSubtitle: 'Track everyday shop cash in & out seamlessly',
    cashInHand: 'Net Cash in Hand',
    addCashEntry: 'New Cash Entry',
    cashIn: 'Cash In',
    cashOut: 'Cash Out',
    allEntries: 'All Entries',
    inOnly: 'Cash In (+)',
    outOnly: 'Cash Out (-)',
    entryType: 'Entry Type',
    category: 'Category',
    sales: 'Sales / Revenue',
    purchase: 'Purchases / Stock',
    expense: 'Shop Expenses',
    other: 'Other',

    reportsTitle: 'Ledger & Business Reports',
    reportsSubtitle: 'Summary of outstanding receivables, payables & summaries',
    downloadPdf: 'Download PDF Report',
    totalMarketUdhaar: 'Total Market Receivable',
    totalSupplierPayable: 'Total Supplier Payable',
    topCustomersUdhaar: 'Top Outstanding Customers',

    shopSettings: 'Shop & App Settings',
    apiConnection: 'Node.js Express API Connection',
    apiConnected: 'Connected to Express Server',
    apiOffline: 'Offline Local Mode',
    configure: 'Configure',
    storeDetails: 'Store Profile Details',
    currencyAndRegional: 'Currency & Language Settings',
    shopCurrency: 'Shop Currency',
    appLanguage: 'App Language',
    saveSettings: 'Save Settings',
    signOut: 'Sign Out',
    settingsSavedSuccess: 'Shop settings updated successfully!',

    voiceTitle: 'BolKhata Voice Assistant',
    voiceSubtitle: 'Speak or tap a phrase to add a voice transaction',
    tapToSpeak: 'Tap & Speak',
    recordingTapToStop: 'Recording... Tap to stop',
    processing: 'Processing...',
    spokenPlaceholder: 'Spoken entry will appear here...',
    sampleCommandsTitle: 'Try sample store commands:',
    parsedEntryReady: 'Parsed Entry Ready:',
    party: 'Party:',
    type: 'Type:',
    amount: 'Amount:',
    confirmAndSave: 'Confirm & Save Entry',
    udhaarGaveLabel: 'You Gave (Udhaar)',
    jamaGotLabel: 'You Received (Jama)',
  },

  hi: {
    home: 'होम',
    customers: 'ग्राहक / खाता',
    cashbook: 'रोकड़ बही',
    reports: 'रिपोर्ट्स',
    settings: 'सेटिंग्स',
    voice: 'बोलकर लिखें',

    shopName: 'दुकान / व्यापार का नाम',
    ownerName: 'मालिक का नाम',
    contactNumber: 'मोबाइल नंबर',

    netLedgerBalance: 'कुल दुकान खाता शेष',
    overallStatus: 'समग्र स्थिति',
    receivable: '(लेना है)',
    payable: '(देना है)',
    youWillCollect: 'आपको मिलेगा',
    youWillCollectSub: 'आप लेंगे (उधार)',
    youWillPay: 'आपको देना है',
    youWillPaySub: 'आप देंगे (जमा)',
    todayCashIn: 'आज की नकद आवक',
    todayCashOut: 'आज का नकद खर्च',

    quickActions: 'त्वरित कार्य',
    addCustomer: 'नया ग्राहक जोड़ें',
    addCustomerSub: 'नया खाता खोलें',
    recordCash: 'नकद प्रविष्टि करें',
    recordCashSub: 'दैनिक रोकड़ बही',
    viewReports: 'रिपोर्ट देखें',
    viewReportsSub: 'पीडीएफ और विवरण',
    recentParties: 'हाल के ग्राहक',
    viewAll: 'सभी देखें',
    noPartiesYet: 'कोई ग्राहक खाता नहीं मिला',
    addFirstCustomer: 'पहला ग्राहक जोड़ें',
    allSettled: 'खाता बराबर है',

    searchPlaceholder: 'ग्राहक का नाम या फोन नंबर खोजें...',
    all: 'सभी',
    toReceive: 'लेना है',
    toPay: 'देना है',
    advancePaid: 'अग्रिम जमा',
    udhaarPending: 'उधार बाकी',
    settledZero: 'बराबर (0)',
    call: 'कॉल',
    reminder: 'तगादा / याद दिलाएं',
    youGave: 'आपने दिया',
    youGot: 'आपको मिला',
    addNewParty: 'नया ग्राहक / सप्लायर जोड़ें',
    customer: 'ग्राहक (Customer)',
    supplier: 'सप्लायर (Supplier)',
    partyType: 'खाते का प्रकार',
    addressOptional: 'पता (वैकल्पिक)',
    openingBalance: 'प्रारंभिक शेष (वैकल्पिक)',

    customerDetail: 'ग्राहक खाता विवरण',
    totalBalance: 'कुल शेष राशि',
    transactionHistory: 'लेन-देन इतिहास',
    noTransactionsYet: 'अभी तक कोई लेन-देन नहीं हुआ',
    sendWhatsAppReminder: 'व्हाट्सएप पर तगादा भेजें',
    youGaveBtn: '+ आपने दिया (उधार)',
    youGotBtn: '+ आपको मिला (जमा)',

    youGaveTitle: 'आपने दिया (उधार)',
    youGotTitle: 'आपको मिला (जमा)',
    enterAmount: 'राशि दर्ज करें',
    quickAdd: 'त्वरित जोड़ें:',
    selectParty: 'ग्राहक चुनें',
    itemDescriptionNote: 'सामान / विवरण (वैकल्पिक)',
    paymentMode: 'भुगतान का प्रकार',
    cash: 'नकद (Cash)',
    onlineBank: 'ऑनलाइन / बैंक',
    creditUdhaar: 'उधार खाता',
    saveTransaction: 'लेन-देन सुरक्षित करें',
    cancel: 'रद्द करें',

    dailyCashbook: 'दैनिक रोकड़ बही',
    cashbookSubtitle: 'दुकान की दैनिक नकद आवक और जावक का हिसाब',
    cashInHand: 'कुल नकद (कैश इन हैंड)',
    addCashEntry: 'नई रोकड़ एंट्री',
    cashIn: 'नकद आवक',
    cashOut: 'नकद जावक',
    allEntries: 'सभी एंट्रीज',
    inOnly: 'नकद आवक (+)',
    outOnly: 'नकद जावक (-)',
    entryType: 'एंट्री प्रकार',
    category: 'श्रेणी',
    sales: 'बिक्री (Sales)',
    purchase: 'खरीद (Purchase)',
    expense: 'दुकान खर्च',
    other: 'अन्य',

    reportsTitle: 'खाता और व्यापार रिपोर्ट्स',
    reportsSubtitle: 'कुल उधार और वसूली का संपूर्ण विवरण',
    downloadPdf: 'पीडीएफ डाउनलोड करें',
    totalMarketUdhaar: 'कुल बाजार उधार',
    totalSupplierPayable: 'कुल सप्लायर बकाया',
    topCustomersUdhaar: 'शीर्ष उधार वाले ग्राहक',

    shopSettings: 'दुकान सेटिंग्स',
    apiConnection: 'Node.js Express API कनेक्शन',
    apiConnected: 'सर्वर से जुड़ा हुआ है',
    apiOffline: 'ऑफ़लाइन लोकल मोड',
    configure: 'बदलें',
    storeDetails: 'दुकान प्रोफाइल',
    currencyAndRegional: 'मुद्रा और क्षेत्रीय सेटिंग्स',
    shopCurrency: 'दुकान की मुद्रा (Currency)',
    appLanguage: 'ऐप की भाषा',
    saveSettings: 'सेटिंग्स सहेजें',
    signOut: 'लॉग आउट',
    settingsSavedSuccess: 'सेटिंग्स सफलतापूर्वक सहेजी गईं!',

    voiceTitle: 'बोलखाता आवाज़ सहायक',
    voiceSubtitle: 'बोलकर खाता जोड़ें या वाक्य चुनें',
    tapToSpeak: 'माइक दबाएं और बोलें',
    recordingTapToStop: 'रिकॉर्डिंग जारी है... रोकने के लिए दबाएं',
    processing: 'प्रोसेसिंग हो रही है...',
    spokenPlaceholder: 'बोला गया वाक्य यहाँ दिखाई देगा...',
    sampleCommandsTitle: 'नमूना वाक्य आज़माएं:',
    parsedEntryReady: 'तैयार प्रविष्टि:',
    party: 'ग्राहक:',
    type: 'प्रकार:',
    amount: 'राशि:',
    confirmAndSave: 'पुष्टि करें और सुरक्षित करें',
    udhaarGaveLabel: 'आपने दिया (उधार)',
    jamaGotLabel: 'आपको मिला (जमा)',
  },

  bn: {
    home: 'হোম',
    customers: 'গ্রাহক / খাতা',
    cashbook: 'ক্যাশ বুক',
    reports: 'রিপোর্ট',
    settings: 'সেটিংস',
    voice: 'ভয়েস এন্ট্রি',

    shopName: 'দোকান / ব্যবসার নাম',
    ownerName: 'মালিকের নাম',
    contactNumber: 'মোবাইল নম্বর',

    netLedgerBalance: 'মোট দোকান খাতার ব্যালেন্স',
    overallStatus: 'সার্বিক অবস্থা',
    receivable: '(পাবেন)',
    payable: '(দিতে হবে)',
    youWillCollect: 'আপনি পাবেন',
    youWillCollectSub: 'আপনি দিয়েছেন (বাকি)',
    youWillPay: 'আপনাকে দিতে হবে',
    youWillPaySub: 'আপনি পেয়েছেন (জমা)',
    todayCashIn: 'আজকের ক্যাশ ইন',
    todayCashOut: 'আজকের ক্যাশ আউট',

    quickActions: 'দ্রুত পদক্ষেপ',
    addCustomer: 'নতুন গ্রাহক যোগ করুন',
    addCustomerSub: 'নতুন খাতা খুলুন',
    recordCash: 'নগদ এন্ট্রি করুন',
    recordCashSub: 'দৈনিক ক্যাশ বুক',
    viewReports: 'রিপোর্ট দেখুন',
    viewReportsSub: 'পিডিএফ এবং হিসাব',
    recentParties: 'সাম্প্রতিক গ্রাহক',
    viewAll: 'সব দেখুন',
    noPartiesYet: 'কোন গ্রাহক পাওয়া যায়নি',
    addFirstCustomer: 'প্রথম গ্রাহক যোগ করুন',
    allSettled: 'হিসাব সম্পন্ন',

    searchPlaceholder: 'গ্রাহকের নাম বা ফোন নম্বর খুঁজুন...',
    all: 'সব',
    toReceive: 'পাবেন',
    toPay: 'দেবেন',
    advancePaid: 'অগ্রিম জমা',
    udhaarPending: 'বাকি পাওনা',
    settledZero: 'সমান (০)',
    call: 'কল',
    reminder: 'স্মরণ করান',
    youGave: 'আপনি দিয়েছেন',
    youGot: 'আপনি পেয়েছেন',
    addNewParty: 'নতুন গ্রাহক যোগ করুন',
    customer: 'গ্রাহক',
    supplier: 'সাপ্লায়ার',
    partyType: 'হিসাবের ধরন',
    addressOptional: 'ঠিকানা (ঐচ্ছিক)',
    openingBalance: 'শুরুর ব্যালেন্স (ঐচ্ছিক)',

    customerDetail: 'গ্রাহক খাতা বিবরণ',
    totalBalance: 'মোট বাকি ব্যালেন্স',
    transactionHistory: 'লেনদেনের ইতিহাস',
    noTransactionsYet: 'এখনো কোন লেনদেন নেই',
    sendWhatsAppReminder: 'হোয়াটসঅ্যাপে রিমাইন্ডার পাঠান',
    youGaveBtn: '+ দিয়েছেন (বাকি)',
    youGotBtn: '+ পেয়েছেন (জমা)',

    youGaveTitle: 'আপনি দিয়েছেন (বাকি)',
    youGotTitle: 'আপনি পেয়েছেন (জমা)',
    enterAmount: 'টাকার পরিমাণ লিখুন',
    quickAdd: 'দ্রুত যোগ করুন:',
    selectParty: 'গ্রাহক নির্বাচন করুন',
    itemDescriptionNote: 'বিবরণ (ঐচ্ছিক)',
    paymentMode: 'পেমেন্টের মাধ্যম',
    cash: 'নগদ (Cash)',
    onlineBank: 'ব্যাংক / অনলাইন',
    creditUdhaar: 'খাতা বাকি',
    saveTransaction: 'লেনদেন সংরক্ষণ করুন',
    cancel: 'বাতিল',

    dailyCashbook: 'দৈনিক ক্যাশ বুক',
    cashbookSubtitle: 'দোকানের দৈনিক নগদ জমা এবং খরচের হিসাব',
    cashInHand: 'হাতে নগদ টাকা',
    addCashEntry: 'নতুন ক্যাশ এন্ট্রি',
    cashIn: 'ক্যাশ ইন',
    cashOut: 'ক্যাশ আউট',
    allEntries: 'সব এন্ট্রি',
    inOnly: 'জমা (+)',
    outOnly: 'খরচ (-)',
    entryType: 'এন্ট্রির ধরন',
    category: 'ক্যাটাগরি',
    sales: 'বিক্রয়',
    purchase: 'ক্রয়',
    expense: 'দোকান খরচ',
    other: 'অন্যান্য',

    reportsTitle: 'খাতা ও ব্যবসার রিপোর্ট',
    reportsSubtitle: 'মোট পাওনা ও দেনার সারসংক্ষেপ',
    downloadPdf: 'পিডিএফ রিপোর্ট ডাউনলোড করুন',
    totalMarketUdhaar: 'মোট মার্কেট পাওনা',
    totalSupplierPayable: 'মোট সাপ্লায়ার দেনা',
    topCustomersUdhaar: 'সর্বোচ্চ বাকি গ্রাহক',

    shopSettings: 'দোকান সেটিংস',
    apiConnection: 'Express API সংযোগ',
    apiConnected: 'সার্ভারের সাথে সংযুক্ত',
    apiOffline: 'অফলাইন মোড',
    configure: 'কনফিগার',
    storeDetails: 'দোকানের প্রোফাইল',
    currencyAndRegional: 'মুদ্রা এবং ভাষা সেটিংস',
    shopCurrency: 'মুদ্রা (Currency)',
    appLanguage: 'অ্যাপের ভাষা',
    saveSettings: 'সেটিংস সংরক্ষণ করুন',
    signOut: 'লগআউট',
    settingsSavedSuccess: 'সেটিংস সফলভাবে সংরক্ষিত হয়েছে!',

    voiceTitle: 'বোলখাতা ভয়েস সহকারী',
    voiceSubtitle: 'কথা বলে খাতা যোগ করুন',
    tapToSpeak: 'মাইক চাপুন এবং বলুন',
    recordingTapToStop: 'রেকর্ডিং হচ্ছে... থামাতে চাপুন',
    processing: 'প্রসেসিং হচ্ছে...',
    spokenPlaceholder: 'বলা কথা এখানে প্রদর্শিত হবে...',
    sampleCommandsTitle: 'নমুনা বাক্য:',
    parsedEntryReady: 'প্রস্তুত এন্ট্রি:',
    party: 'গ্রাহক:',
    type: 'ধরন:',
    amount: 'পরিমাণ:',
    confirmAndSave: 'নিশ্চিত করুন এবং সংরক্ষণ করুন',
    udhaarGaveLabel: 'আপনি দিয়েছেন (বাকি)',
    jamaGotLabel: 'আপনি পেয়েছেন (জমা)',
  },

  es: {
    home: 'Inicio',
    customers: 'Clientes',
    cashbook: 'Caja Diaria',
    reports: 'Reportes',
    settings: 'Ajustes',
    voice: 'Voz',

    shopName: 'Nombre del Negocio',
    ownerName: 'Nombre del Propietario',
    contactNumber: 'Número de Contacto',

    netLedgerBalance: 'Saldo Neto del Negocio',
    overallStatus: 'Estado General',
    receivable: '(Por Cobrar)',
    payable: '(Por Pagar)',
    youWillCollect: 'Por Cobrar',
    youWillCollectSub: 'Crédito entregado',
    youWillPay: 'Por Pagar',
    youWillPaySub: 'Pago recibido',
    todayCashIn: 'Ingreso en Efectivo Hoy',
    todayCashOut: 'Egreso en Efectivo Hoy',

    quickActions: 'Acciones Rápidas',
    addCustomer: 'Nuevo Cliente',
    addCustomerSub: 'Abrir nueva cuenta',
    recordCash: 'Registrar Efectivo',
    recordCashSub: 'Libro de caja diario',
    viewReports: 'Ver Reportes',
    viewReportsSub: 'PDF y balances',
    recentParties: 'Clientes Recientes',
    viewAll: 'Ver Todo',
    noPartiesYet: 'Sin clientes aún',
    addFirstCustomer: 'Agregar Primer Cliente',
    allSettled: 'Todo al día',

    searchPlaceholder: 'Buscar nombre o teléfono...',
    all: 'Todos',
    toReceive: 'Por Cobrar',
    toPay: 'Por Pagar',
    advancePaid: 'Anticipo',
    udhaarPending: 'Saldo Pendiente',
    settledZero: 'Al día (0)',
    call: 'Llamar',
    reminder: 'Recordatorio',
    youGave: 'Entregó',
    youGot: 'Recibió',
    addNewParty: 'Agregar Nuevo Cliente',
    customer: 'Cliente',
    supplier: 'Proveedor',
    partyType: 'Tipo de Cuenta',
    addressOptional: 'Dirección (Opcional)',
    openingBalance: 'Saldo Inicial (Opcional)',

    customerDetail: 'Detalle del Cliente',
    totalBalance: 'Saldo Pendiente Total',
    transactionHistory: 'Historial de Transacciones',
    noTransactionsYet: 'Sin transacciones aún',
    sendWhatsAppReminder: 'Enviar Recordatorio WhatsApp',
    youGaveBtn: '+ ENTREGÓ (Crédito)',
    youGotBtn: '+ RECIBIÓ (Pago)',

    youGaveTitle: 'Entregó (Crédito)',
    youGotTitle: 'Recibió (Pago)',
    enterAmount: 'Monto',
    quickAdd: 'Rápido:',
    selectParty: 'Seleccionar Cliente',
    itemDescriptionNote: 'Descripción o nota (opcional)',
    paymentMode: 'Método de Pago',
    cash: 'Efectivo',
    onlineBank: 'Transferencia / Banco',
    creditUdhaar: 'Crédito en Cuenta',
    saveTransaction: 'Guardar Transacción',
    cancel: 'Cancelar',

    dailyCashbook: 'Libro de Caja Diario',
    cashbookSubtitle: 'Controla ingresos y egresos diarios',
    cashInHand: 'Efectivo en Mano',
    addCashEntry: 'Nueva Entrada de Caja',
    cashIn: 'Entrada de Caja',
    cashOut: 'Salida de Caja',
    allEntries: 'Todos los Registros',
    inOnly: 'Ingresos (+)',
    outOnly: 'Egresos (-)',
    entryType: 'Tipo de Entrada',
    category: 'Categoría',
    sales: 'Ventas',
    purchase: 'Compras',
    expense: 'Gastos',
    other: 'Otro',

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
  return TRANSLATIONS.ur; // Default to Urdu
};
