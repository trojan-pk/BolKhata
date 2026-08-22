/**
 * BolKhata palette.
 *
 * Deliberately near-monochrome: ink on paper, separated by hairlines rather than
 * shadows or fills. Colour carries meaning and nothing else —
 *
 *   • `accent`  interactive + voice/AI affordances
 *   • `credit`  money coming to you   (to collect, payment received)
 *   • `debit`   money going out       (to pay, credit given)
 *
 * Following the ledger convention shopkeepers already know: green is what you
 * will get, red is what you will give.
 */
export const COLORS = {
  /* ------------------------------------------------------------- surfaces -- */
  /** App background. A hair warmer than the cards that sit on it. */
  paper: '#F6F7F9',
  surface: '#FFFFFF',
  /** Inset fields, quiet rows inside a card. */
  surfaceMuted: '#F2F4F7',
  /** Pressed / sunken state. */
  surfaceSunken: '#E9EDF2',
  /** Full-strength ink surface — primary buttons, the balance card, the dock. */
  ink: '#0B0F1A',
  inkSoft: '#1B2331',
  inkLift: '#2B3546',

  /* ---------------------------------------------------------------- text -- */
  textPrimary: '#0B0F1A',
  textSecondary: '#4A5468',
  textMuted: '#78849A',
  textFaint: '#A3ADBE',
  textOnInk: '#FFFFFF',
  textOnInkMuted: '#98A4B8',

  /* ------------------------------------------------------------ hairlines -- */
  hairline: '#E8EBF0',
  hairlineStrong: '#D8DDE6',

  /* --------------------------------------------------------------- accent -- */
  accent: '#4F46E5',
  accentPressed: '#4338CA',
  accentSoft: '#EFF0FE',
  accentBorder: '#D5D8FB',

  /* ----------------------------------------------- money: in (to collect) -- */
  credit: '#067647',
  creditStrong: '#05603A',
  creditSoft: '#ECFDF3',
  creditBorder: '#CFF3E0',

  /* --------------------------------------------------- money: out (to pay) -- */
  debit: '#B42318',
  debitStrong: '#912018',
  debitSoft: '#FEF3F2',
  debitBorder: '#FBDAD6',

  /* --------------------------------------------------------------- status -- */
  warning: '#B54708',
  warningSoft: '#FFFAEB',
  warningBorder: '#FDE3A7',
  info: '#175CD3',
  infoSoft: '#EFF8FF',
  infoBorder: '#D3E7FD',
  whatsapp: '#1FA855',
  whatsappSoft: '#ECFDF3',

  /* ----------------------------------------------------------- scrims etc -- */
  scrim: 'rgba(11, 15, 26, 0.44)',
  scrimStrong: 'rgba(11, 15, 26, 0.62)',

  /* ------------------------------------------------------------------------ */
  /* Legacy aliases. Older call sites still import these names; they resolve  */
  /* to the tokens above so nothing renders off-palette.                      */
  /* ------------------------------------------------------------------------ */
  bg: '#F6F7F9',
  bgCard: '#FFFFFF',
  surfaceSubtle: '#F2F4F7',
  surfaceHover: '#E9EDF2',
  border: '#E8EBF0',
  borderDark: '#D8DDE6',
  borderFocus: '#4F46E5',
  primary: '#4F46E5',
  primaryLight: '#EFF0FE',
  primaryDark: '#4338CA',
  gaveRed: '#B42318',
  gaveRedBg: '#FEF3F2',
  gaveRedBorder: '#FBDAD6',
  gotGreen: '#067647',
  gotGreenBg: '#ECFDF3',
  gotGreenBorder: '#CFF3E0',
  warningBg: '#FFFAEB',
  whatsappBg: '#ECFDF3',
} as const;

/**
 * Avatar tints. Muted, low-chroma pairs so a list of twenty customers still
 * reads as one calm surface. Picked deterministically from the party name.
 */
export const AVATAR_TINTS: { bg: string; fg: string }[] = [
  { bg: '#E7E9FC', fg: '#3730A3' },
  { bg: '#DEEFFC', fg: '#0E4C92' },
  { bg: '#DCF3EA', fg: '#065F46' },
  { bg: '#FBE9E7', fg: '#9A2A1F' },
  { bg: '#F6E8FB', fg: '#6B21A8' },
  { bg: '#FDEFD8', fg: '#92400E' },
  { bg: '#E3F0F5', fg: '#0F5A6E' },
  { bg: '#EDEAE3', fg: '#57534E' },
];
