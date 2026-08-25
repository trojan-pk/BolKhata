import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FaWhatsapp } from "react-icons/fa6";
import { Link2Off } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACE, TYPE } from '../theme/tokens';
import { Button, Press } from '../ui';
import { getApiBaseUrl } from '../services/api';

type WaStatus = 'idle' | 'connecting' | 'linked' | 'error';

interface Props {
  visible: boolean;
  userId: string;
  onClose: () => void;
  onLinked?: (phone: string) => void;
  onUnlinked?: () => void;
}

export const WhatsAppLinkModal: React.FC<Props> = ({
  visible,
  userId,
  onClose,
  onLinked,
  onUnlinked,
}) => {
  const [status, setStatus] = useState<WaStatus>('idle');
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Use 'any' for EventSource — it's a Web API not typed in React Native's lib
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const esRef = useRef<any | null>(null);
  // Track status in a ref so the onerror closure always reads the latest value
  const statusRef = useRef<WaStatus>('idle');

  function updateStatus(s: WaStatus) {
    statusRef.current = s;
    setStatus(s);
  }

  // ─── start SSE stream when modal opens ─────────────────────────────────────
  useEffect(() => {
    if (!visible) {
      cleanup();
      return;
    }
    startLinking();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, userId]);

  function cleanup() {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
  }

  function startLinking() {
    updateStatus('connecting');
    setQrBase64(null);
    setError(null);

    const url = `${getApiBaseUrl()}/wa/link/${userId}`;
    // EventSource is a Web API — available in Expo web & React Native via
    // the runtime polyfill; cast via 'any' to avoid missing global typings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const es: any = new (globalThis as any).EventSource(url);
    esRef.current = es;

    es.addEventListener('qr', (e: { data: string }) => {
      const data = JSON.parse(e.data) as { qr: string };
      setQrBase64(data.qr);
      updateStatus('connecting');
    });

    es.addEventListener('connected', (e: { data: string }) => {
      const data = JSON.parse(e.data) as { phone?: string };
      setPhone(data.phone ?? null);
      updateStatus('linked');
      es.close();
      if (onLinked && data.phone) onLinked(data.phone);
    });

    es.addEventListener('error', (e: { data?: string }) => {
      try {
        const data = JSON.parse(e.data ?? '{}') as { error?: string };
        setError(data.error ?? 'Connection failed');
      } catch {
        setError('Connection failed');
      }
      updateStatus('error');
      es.close();
    });

    es.onerror = () => {
      // SSE closes naturally after 'connected' — only treat as error if not yet linked
      if (statusRef.current !== 'linked') {
        setError('Lost connection to server');
        updateStatus('error');
      }
    };
  }

  async function handleUnlink() {
    try {
      await fetch(`${getApiBaseUrl()}/wa/link/${userId}`, { method: 'DELETE' });
      updateStatus('idle');
      setPhone(null);
      setQrBase64(null);
      if (onUnlinked) onUnlinked();
    } catch {
      setError('Failed to unlink');
    }
  }

  // ─── render ─────────────────────────────────────────────────────────────────
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
          <View style={styles.headerLeft}>
            <View style={styles.waIcon}>
              <FaWhatsapp size={22} color="#25D366" />
            </View>
            <Text style={[TYPE.title2, styles.title]}>WhatsApp Account Link</Text>
          </View>
          <Press onPress={onClose} style={styles.closeBtn}>
            <Text style={[TYPE.label, styles.closeTxt]}>Done</Text>
          </Press>
        </View>

        <Text style={[TYPE.body, styles.subtitle]}>
          Link your WhatsApp account to send payment reminders directly from
          BolKhata — no browser tabs needed!
        </Text>

        {/* ── linked ── */}
        {status === 'linked' && phone ? (
          <View style={styles.linkedCard}>
            <View style={styles.linkedHeader}>
              <FaWhatsapp size={35} color="#25D366" strokeWidth={2} />
              <View style={styles.linkedTextCol}>
                <Text style={[TYPE.title3, styles.linkedTitle]}>WhatsApp Linked & Active</Text>
                <Text style={[TYPE.body, styles.linkedPhone]}>Phone: +{phone}</Text>
              </View>
            </View>
            <Button
              label="Unlink WhatsApp Account"
              icon={Link2Off}
              variant="secondary"
              size="md"
              onPress={handleUnlink}
              style={styles.unlinkBtn}
            />
          </View>
        ) : null}

        {/* ── instructions + qr ── */}
        {status === 'connecting' ? (
          <View style={styles.linkContainer}>
            {/* Steps card */}
            <View style={styles.stepsCard}>
              <Text style={[TYPE.label, styles.stepsTitle]}>How to link your WhatsApp:</Text>
              
              <View style={styles.stepRow}>
                <View style={styles.stepBadge}><Text style={styles.stepNum}>1</Text></View>
                <Text style={styles.stepText}>Open <Text style={styles.boldText}>WhatsApp</Text> on your phone</Text>
              </View>

              <View style={styles.stepRow}>
                <View style={styles.stepBadge}><Text style={styles.stepNum}>2</Text></View>
                <Text style={styles.stepText}>Tap <Text style={styles.boldText}>Menu ⋮</Text> or <Text style={styles.boldText}>Settings ⚙</Text> → <Text style={styles.boldText}>Linked Devices</Text></Text>
              </View>

              <View style={styles.stepRow}>
                <View style={styles.stepBadge}><Text style={styles.stepNum}>3</Text></View>
                <Text style={styles.stepText}>Tap <Text style={styles.boldText}>Link a Device</Text> and scan the QR code below</Text>
              </View>
            </View>

            {/* QR box */}
            {qrBase64 ? (
              <View style={styles.qrSection}>
                <View style={styles.qrFrame}>
                  <Image
                    source={{ uri: `data:image/png;base64,${qrBase64}` }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                </View>
                <Button
                  label="Refresh QR Code"
                  variant="secondary"
                  size="sm"
                  onPress={startLinking}
                  style={styles.refreshBtn}
                />
              </View>
            ) : (
              <View style={styles.center}>
                <ActivityIndicator size="large" color="#25D366" />
                <Text style={[TYPE.caption, styles.hint]}>Generating QR code…</Text>
              </View>
            )}
          </View>
        ) : null}

        {/* ── error ── */}
        {status === 'error' ? (
          <View style={styles.errorCard}>
            <Text style={[TYPE.body, styles.errorText]}>{error}</Text>
            <Button
              label="Try Again"
              variant="secondary"
              size="sm"
              onPress={startLinking}
              style={styles.retryBtn}
            />
          </View>
        ) : null}

        {/* ── idle (initial) ── */}
        {status === 'idle' ? (
          <View style={styles.center}>
            <Button
              label="Start Linking"
              variant="primary"
              size="lg"
              onPress={startLinking}
            />
          </View>
        ) : null}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACE.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  waIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E8F9F0',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: SPACE.md,
    lineHeight: 22,
  },
  // linked
  linkedCard: {
    alignItems: 'center',
    gap: SPACE.lg,
    padding: SPACE.xl,
    borderRadius: RADIUS.xl,
    backgroundColor: '#E8F9F0',
    borderWidth: 1.5,
    borderColor: '#25D366',
  },
  linkedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
  },
  linkedTextCol: {
    gap: 2,
  },
  linkedTitle: {
    color: '#075E54',
    fontWeight: '700',
  },
  linkedPhone: {
    color: '#128C7E',
    fontWeight: '600',
  },
  unlinkBtn: {
    alignSelf: 'stretch',
  },
  // instructions & qr
  linkContainer: {
    gap: SPACE.xl,
  },
  stepsCard: {
    padding: SPACE.lg,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    gap: SPACE.md,
  },
  stepsTitle: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E8F9F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: {
    color: '#25D366',
    fontWeight: '800',
    fontSize: 13,
  },
  stepText: {
    ...TYPE.body,
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
  boldText: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  qrSection: {
    alignItems: 'center',
    gap: SPACE.md,
  },
  qrFrame: {
    padding: SPACE.lg,
    borderRadius: RADIUS.xxl,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#25D366',
    shadowColor: '#25D366',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  qrImage: {
    width: 230,
    height: 230,
  },
  hint: {
    color: COLORS.textMuted,
    textAlign: 'center',
    maxWidth: 280,
  },
  refreshBtn: {
    marginTop: SPACE.sm,
  },
  // error
  errorCard: {
    alignItems: 'center',
    gap: SPACE.md,
    padding: SPACE.xl,
    borderRadius: RADIUS.xl,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  errorText: {
    color: '#C53030',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: SPACE.xs,
  },
  // misc
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACE.xxl,
    gap: SPACE.md,
  },
});
