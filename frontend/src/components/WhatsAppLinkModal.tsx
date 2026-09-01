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
import { WhatsAppIcon } from './WhatsAppIcon';
import { Link2Off } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACE, TYPE } from '../theme/tokens';
import { Button, Press } from '../ui';
import { ApiService } from '../services/api';

type WaStatus = 'idle' | 'connecting' | 'linked' | 'error';

interface Props {
  visible: boolean;
  onClose: () => void;
  onLinked?: (phone: string) => void;
  onUnlinked?: () => void;
}

export const WhatsAppLinkModal: React.FC<Props> = ({
  visible,
  onClose,
  onLinked,
  onUnlinked,
}) => {
  const [status, setStatus] = useState<WaStatus>('idle');
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const esRef = useRef<any | null>(null);
  const pollTimerRef = useRef<any | null>(null);
  const statusRef = useRef<WaStatus>('idle');
  const mountedRef = useRef<boolean>(true);

  function updateStatus(s: WaStatus) {
    statusRef.current = s;
    setStatus(s);
  }

  // ─── start pairing when modal opens ────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    if (!visible) {
      cleanup();
      return;
    }
    startLinking();
    return () => {
      mountedRef.current = false;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function cleanup() {
    if (esRef.current) {
      try { esRef.current.close(); } catch { /* ignore */ }
      esRef.current = null;
    }
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }

  /**
   * Universal pairing engine:
   * 1. Fetches current QR immediately via REST (`GET /wa/qr`).
   * 2. Sets up a 2-second background poll for seamless mobile & web reliability.
   * 3. Opens an SSE stream if native `EventSource` is available in the environment.
   */
  async function startLinking(forceRefresh = false) {
    cleanup();
    updateStatus('connecting');
    setQrBase64(null);
    setError(null);

    // If explicit refresh requested, tell backend to restart Baileys pairing
    if (forceRefresh) {
      try {
        await ApiService.refreshWaQr();
      } catch {
        // Non-blocking, continue with fetch
      }
    }

    // 1. Immediate fetch of latest QR / status
    try {
      const initial = await ApiService.getWaQr();
      if (!mountedRef.current) return;
      if (initial.status === 'linked' && initial.phone) {
        setPhone(initial.phone);
        updateStatus('linked');
        if (onLinked) onLinked(initial.phone);
        return;
      }
      if (initial.qr) {
        setQrBase64(initial.qr);
      }
    } catch (e) {
      console.warn('[WhatsAppLink] Initial QR query notice:', e);
    }

    // 2. Continuous Polling Fallback (ensures React Native mobile works 100%)
    pollTimerRef.current = setInterval(async () => {
      if (!mountedRef.current || statusRef.current === 'linked') {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        return;
      }
      try {
        const res = await ApiService.getWaQr();
        if (!mountedRef.current) return;
        if (res.status === 'linked') {
          if (res.phone) setPhone(res.phone);
          updateStatus('linked');
          cleanup();
          if (onLinked && res.phone) onLinked(res.phone);
          return;
        }
        if (res.qr && res.qr !== qrBase64) {
          setQrBase64(res.qr);
        }
      } catch {
        // Non-blocking poll retry
      }
    }, 2000);

    // 3. Web SSE Stream (when browser EventSource is present)
    try {
      const isEventSourceAvailable =
        typeof window !== 'undefined' &&
        typeof (window as any).EventSource === 'function';

      if (isEventSourceAvailable) {
        const url = await ApiService.waLinkStreamUrl();
        if (!mountedRef.current) return;

        const es: any = new (window as any).EventSource(url);
        esRef.current = es;

        es.addEventListener('qr', (e: { data: string }) => {
          if (!mountedRef.current) return;
          try {
            const data = JSON.parse(e.data) as { qr: string };
            if (data.qr) {
              setQrBase64(data.qr);
              updateStatus('connecting');
            }
          } catch { /* ignore */ }
        });

        es.addEventListener('connected', (e: { data: string }) => {
          if (!mountedRef.current) return;
          try {
            const data = JSON.parse(e.data) as { phone?: string };
            setPhone(data.phone ?? null);
            updateStatus('linked');
            cleanup();
            if (onLinked && data.phone) onLinked(data.phone);
          } catch { /* ignore */ }
        });

        es.addEventListener('error', (e: { data?: string }) => {
          if (!mountedRef.current) return;
          if (statusRef.current !== 'linked') {
            try {
              const data = JSON.parse(e.data ?? '{}') as { error?: string };
              if (data.error) setError(data.error);
            } catch { /* non-fatal error */ }
          }
        });
      }
    } catch (e) {
      console.warn('[WhatsAppLink] SSE stream notice (polling active):', e);
    }
  }

  async function handleRefresh() {
    await startLinking(true);
  }

  async function handleUnlink() {
    try {
      await ApiService.unlinkWa();
      updateStatus('idle');
      setPhone(null);
      setQrBase64(null);
      if (onUnlinked) onUnlinked();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to unlink');
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
              <WhatsAppIcon size={22} color="#25D366" />
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
              <WhatsAppIcon size={35} color="#25D366" />
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
                  onPress={handleRefresh}
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
              onPress={handleRefresh}
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
