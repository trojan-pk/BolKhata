"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePersonNameToEnglish = normalizePersonNameToEnglish;
// Transliterates common Urdu script names into standard English / Roman TitleCase
const URDU_NAME_MAP = {
    'پاپا': 'Papa',
    'علی': 'Ali',
    'احمد': 'Ahmad',
    'قاسم': 'Qasim',
    'حمزہ': 'Hamza',
    'کاشف': 'Kashif',
    'بابر': 'Babar',
    'عثمان': 'Usman',
    'کامران': 'Kamran',
    'بلال': 'Bilal',
    'طارق': 'Tariq',
    'رضوان': 'Rizwan',
    'حسن': 'Hassan',
    'حسین': 'Hussain',
    'عمر': 'Umar',
    'فرحان': 'Farhan',
    'سلمان': 'Salman',
    'وقاص': 'Waqas',
    'زبیر': 'Zubair',
    'عرفان': 'Irfan',
    'عامر': 'Aamir',
    'ساجد': 'Sajid',
    'ماجد': 'Majid',
    'طاہر': 'Tahir',
    'ناصر': 'Nasir',
    'اصغر': 'Asghar',
    'اکبر': 'Akbar',
    'انور': 'Anwar',
    'راشد': 'Rashid',
    'شاہد': 'Shahid',
    'زاہد': 'Zahid',
    'ارسلان': 'Arslan',
    'یاسر': 'Yasir',
    'ندیم': 'Nadeem',
    'وسیم': 'Waseem',
    'سہیل': 'Sohail',
    'نعیم': 'Naeem',
    'آصف': 'Asif',
    'عاطف': 'Atif',
    'خالد': 'Khalid',
    'جاوید': 'Javed',
    'شعیب': 'Shoaib',
    'شہزاد': 'Shahzad',
    'سلیم': 'Saleem',
    'فیصل': 'Faisal',
    'وقار': 'Waqar',
    'امجد': 'Amjad',
    'نوید': 'Naveed',
    'عباس': 'Abbas',
    'زین': 'Zain',
};
function normalizePersonNameToEnglish(name) {
    if (!name)
        return 'Customer';
    const trimmed = name.trim();
    // Check direct Urdu script dictionary
    if (URDU_NAME_MAP[trimmed]) {
        return URDU_NAME_MAP[trimmed];
    }
    // Remove trailing punctuation or Urdu markers
    const cleaned = trimmed.replace(/[.\s,?!۔]/g, '');
    if (URDU_NAME_MAP[cleaned]) {
        return URDU_NAME_MAP[cleaned];
    }
    // If already Latin / English text, convert to Title Case
    if (/^[a-zA-Z\s]+$/.test(cleaned)) {
        return cleaned
            .toLowerCase()
            .split(' ')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
    }
    return cleaned || 'Customer';
}
