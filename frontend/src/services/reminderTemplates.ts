import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ReminderTemplate {
  id: string;
  name: string;
  template: string;
  isPreset?: boolean;
}

export const PRESET_TEMPLATES: ReminderTemplate[] = [
  {
    id: 'preset_friendly',
    name: 'Friendly & Polite',
    isPreset: true,
    template:
      `*Payment Reminder* 💸\n\n` +
      `Dear _{customer_name}_,\n` +
      `Your current outstanding balance at *{store_name}* is \`Rs {amount}\`.\n\n` +
      `> Please clear the pending dues when convenient.\n\n` +
      `Thank you for your business! 🙏`,
  },
  {
    id: 'preset_formal',
    name: 'Formal Statement',
    isPreset: true,
    template:
      `*STATEMENT OF ACCOUNT*\n\n` +
      `Customer: *{customer_name}*\n` +
      `Shop: *{store_name}*\n` +
      `Amount Due: \`Rs {amount}\`\n\n` +
      `> This is a request to settle your pending ledger balance.\n\n` +
      `- Cash or Online transfer accepted\n` +
      `- Contact us if you have any questions`,
  },
  {
    id: 'preset_urgent',
    name: 'Urgent & Direct',
    isPreset: true,
    template:
      `🚨 *URGENT: Outstanding Balance*\n\n` +
      `Hello _{customer_name}_, you have an unpaid ledger amount of *Rs {amount}* at *{store_name}*.\n\n` +
      `> Please arrange payment today to keep your credit account active.\n\n` +
      `1. Check your balance: *Rs {amount}*\n` +
      `2. Send payment via UPI / Bank / Cash`,
  },
];

export const DEFAULT_CUSTOM_TEMPLATE: ReminderTemplate = {
  id: 'custom',
  name: 'My Custom Template',
  isPreset: false,
  template:
    `Assalam-o-Alaikum _{customer_name}_,\n\n` +
    `Reminder from *{store_name}*. Pending balance is *Rs {amount}*.\n\n` +
    `> Kindly clear your dues soon. Thanks!`,
};

const STORAGE_KEY_SELECTED = '@bolkhata_wa_template_id';
const STORAGE_KEY_CUSTOM = '@bolkhata_wa_custom_template';

export async function getSelectedTemplateId(): Promise<string> {
  try {
    const val = await AsyncStorage.getItem(STORAGE_KEY_SELECTED);
    return val || PRESET_TEMPLATES[0].id;
  } catch {
    return PRESET_TEMPLATES[0].id;
  }
}

export async function setSelectedTemplateId(id: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_SELECTED, id);
  } catch {}
}

export async function getCustomTemplateText(): Promise<string> {
  try {
    const val = await AsyncStorage.getItem(STORAGE_KEY_CUSTOM);
    return val || DEFAULT_CUSTOM_TEMPLATE.template;
  } catch {
    return DEFAULT_CUSTOM_TEMPLATE.template;
  }
}

export async function saveCustomTemplateText(text: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_CUSTOM, text);
  } catch {}
}

export async function getActiveTemplateText(): Promise<string> {
  const selectedId = await getSelectedTemplateId();
  if (selectedId === 'custom') {
    return await getCustomTemplateText();
  }
  const preset = PRESET_TEMPLATES.find((p) => p.id === selectedId);
  return preset ? preset.template : PRESET_TEMPLATES[0].template;
}
