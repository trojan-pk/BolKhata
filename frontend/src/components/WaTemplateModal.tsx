import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Check, Edit3, Sparkles } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACE, TYPE } from '../theme/tokens';
import { Button, Card, Press, useFeedback } from '../ui';
import {
  PRESET_TEMPLATES,
  getCustomTemplateText,
  getSelectedTemplateId,
  saveCustomTemplateText,
  setSelectedTemplateId,
} from '../services/reminderTemplates';
import { WaMarkdownPreview } from './WaMarkdownPreview';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const WaTemplateModal: React.FC<Props> = ({ visible, onClose }) => {
  const { toast } = useFeedback();
  const [selectedId, setSelectedId] = useState<string>(PRESET_TEMPLATES[0].id);
  const [customText, setCustomText] = useState<string>('');
  const [editingCustom, setEditingCustom] = useState(false);

  useEffect(() => {
    if (!visible) return;
    getSelectedTemplateId().then(setSelectedId);
    getCustomTemplateText().then(setCustomText);
  }, [visible]);

  const handleSelect = async (id: string) => {
    setSelectedId(id);
    await setSelectedTemplateId(id);
    toast('Template active ✓');
  };

  const handleSaveCustom = async () => {
    await saveCustomTemplateText(customText);
    await setSelectedTemplateId('custom');
    setSelectedId('custom');
    setEditingCustom(false);
    toast('Custom template saved & set active ✓');
  };

  const currentTemplateText =
    selectedId === 'custom'
      ? customText
      : PRESET_TEMPLATES.find((p) => p.id === selectedId)?.template ||
        PRESET_TEMPLATES[0].template;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Sparkles size={22} color={COLORS.whatsapp} />
            <Text style={[TYPE.title2, styles.title]}>Reminder Templates</Text>
          </View>
          <Press onPress={onClose} style={styles.closeBtn}>
            <Text style={[TYPE.label, styles.closeTxt]}>Done</Text>
          </Press>
        </View>

        <Text style={[TYPE.body, styles.subtitle]}>
          Choose one of the 3 ready message formats or write your own custom
          template. Use variables <Text style={styles.varCode}>{'{customer_name}'}</Text>,{' '}
          <Text style={styles.varCode}>{'{amount}'}</Text>, and{' '}
          <Text style={styles.varCode}>{'{store_name}'}</Text>.
        </Text>

        {/* ── 3 Presets ── */}
        <Text style={[TYPE.label, styles.sectionTitle]}>Preset Templates</Text>

        <View style={styles.presetGrid}>
          {PRESET_TEMPLATES.map((preset) => {
            const active = selectedId === preset.id;
            return (
              <Press
                key={preset.id}
                onPress={() => handleSelect(preset.id)}
                style={[styles.presetCard, active && styles.presetCardActive]}
              >
                <View style={styles.presetCardHeader}>
                  <Text
                    style={[
                      TYPE.label,
                      active ? styles.presetNameActive : styles.presetName,
                    ]}
                  >
                    {preset.name}
                  </Text>
                  {active ? (
                    <View style={styles.activeCheck}>
                      <Check size={14} color="#FFF" strokeWidth={2.5} />
                    </View>
                  ) : null}
                </View>
              </Press>
            );
          })}
        </View>

        {/* ── 1 Custom Format ── */}
        <Text style={[TYPE.label, styles.sectionTitle]}>Custom Format</Text>

        <Press
          onPress={() => {
            handleSelect('custom');
            setEditingCustom(true);
          }}
          style={[
            styles.presetCard,
            selectedId === 'custom' && styles.presetCardActive,
          ]}
        >
          <View style={styles.presetCardHeader}>
            <View style={styles.row}>
              <Edit3 size={16} color={selectedId === 'custom' ? COLORS.whatsapp : COLORS.textMuted} />
              <Text
                style={[
                  TYPE.label,
                  selectedId === 'custom'
                    ? styles.presetNameActive
                    : styles.presetName,
                ]}
              >
                My Custom Template
              </Text>
            </View>
            {selectedId === 'custom' ? (
              <View style={styles.activeCheck}>
                <Check size={14} color="#FFF" strokeWidth={2.5} />
              </View>
            ) : null}
          </View>
        </Press>

        {/* Custom Editor */}
        {selectedId === 'custom' || editingCustom ? (
          <Card padding={SPACE.md} style={styles.editorCard}>
            <Text style={[TYPE.caption, styles.editorHint]}>
              Markdown support: *bold*, _italic_, ~strike~, `mono`, {'>'} quote, - list
            </Text>
            <TextInput
              multiline
              value={customText}
              onChangeText={setCustomText}
              placeholder="Write your custom WhatsApp message template..."
              style={styles.textInput}
              textAlignVertical="top"
            />
            <Button
              label="Save & Use Custom Template"
              variant="primary"
              size="sm"
              onPress={handleSaveCustom}
              style={styles.saveBtn}
            />
          </Card>
        ) : null}

        {/* ── Live Preview ── */}
        <View style={styles.previewSection}>
          <Text style={[TYPE.label, styles.sectionTitle]}>
            WhatsApp Live Preview
          </Text>
          <WaMarkdownPreview text={currentTemplateText} />
        </View>
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  content: {
    padding: SPACE.xl,
    paddingBottom: SPACE.huge,
    gap: SPACE.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACE.xs,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  title: {
    color: COLORS.textPrimary,
  },
  closeBtn: {
    padding: SPACE.sm,
  },
  closeTxt: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  subtitle: {
    color: COLORS.textSecondary,
    marginBottom: SPACE.sm,
    lineHeight: 20,
  },
  varCode: {
    fontFamily: 'monospace',
    backgroundColor: '#E2E8F0',
    fontSize: 12,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    marginTop: SPACE.md,
    marginBottom: SPACE.xs,
  },
  presetGrid: {
    gap: SPACE.sm,
  },
  presetCard: {
    padding: SPACE.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.hairline,
  },
  presetCardActive: {
    borderColor: COLORS.whatsapp,
    backgroundColor: COLORS.whatsappSoft,
  },
  presetCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  presetName: {
    color: COLORS.textPrimary,
  },
  presetNameActive: {
    color: COLORS.whatsapp,
    fontWeight: '700',
  },
  activeCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.whatsapp,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editorCard: {
    marginTop: SPACE.xs,
    gap: SPACE.sm,
  },
  editorHint: {
    color: COLORS.textMuted,
  },
  textInput: {
    minHeight: 110,
    padding: SPACE.sm,
    borderRadius: RADIUS.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.hairline,
    fontSize: 14,
    fontFamily: 'monospace',
    color: COLORS.textPrimary,
  },
  saveBtn: {
    alignSelf: 'flex-end',
  },
  previewSection: {
    marginTop: SPACE.lg,
    gap: SPACE.sm,
  },
});
