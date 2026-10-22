import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WhatsAppIcon } from './WhatsAppIcon';
import { Link2Off, Phone as PhoneIcon } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACE, TYPE } from '../theme/tokens';
import { Button, Press, TextField } from '../ui';
import { getApiBaseUrl } from '../services/api';

type WaStatus = 'idle' | 'connecting' | 'linked' | 'error';

interface Props {
  visible: boolean;
  userId: string;
  /** Prefills the number field (e.g. the store's mobile). */
  defaultPhone?: string;
  onClose: () => void;
  onLinked?: (phone: string) => void;
  onUnlinked?: () => void;
}

/**
 * Same rules as the backend's normalizePairingPhone: digits only, `00` / local
 * `0` prefixes rewritten to a Pakistani country code. Returns null if invalid.
 */
function normalizePhone(raw: string): string | null {
  let digits = String(raw || '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = '92' + digits.slice(1);
  return digits.length >= 10 && digits.length <= 15 ? digits : null;
}

export const WhatsAppLinkModal: React.FC<Props> = ({
  visible,
  userId,
  defaultPhone,
  onClose,
  onLinked,
  onUnlinked,
}) => {
  const [status, setStatus] = useState<WaStatus>('idle');
  const [phoneInput, setPhoneInput] = useState(defaultPhone ?? '');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  /** Phone accepted the code; WhatsApp is finishing the login. */
  const [paired, setPaired] = useState(false);
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

  // ─── check status when modal opens ────────────────────────────────────────
  useEffect(() => {
    if (!visible) {
      cleanup();
      return;
    }
    initModal();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, userId]);

  useEffect(() => {
    if (defaultPhone && !phoneInput) setPhoneInput(defaultPhone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultPhone]);

  function cleanup() {
    clearCodeTimeout();
    stopPolling();
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
  }

  // If no code arrives, say so instead of spinning forever (e.g. the server is
  // an old build that only emits `qr`, or WhatsApp is unreachable from it).
  const codeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  function clearCodeTimeout() {
    if (codeTimeoutRef.current) {
      clearTimeout(codeTimeoutRef.current);
      codeTimeoutRef.current = null;
    }
  }

  // Fallback when the event stream drops after a code was shown: the pairing
  // keeps running on the server, so ask it directly until it finishes.
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasCodeRef = useRef(false);
  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  function onTransportLost() {
    if (esRef.current) {
      // Also stops the browser's EventSource auto-reconnect, which would hit
      // /wa/link again and restart pairing with a brand-new code.
      esRef.current.close();
      esRef.current = null;
    }
    if (statusRef.current !== 'connecting') return;
    if (!hasCodeRef.current) {
      clearCodeTimeout();
      setError('Lost connection to server');
      updateStatus('error');
      return;
    }
    if (pollRef.current) return;

    const startedAt = Date.now();
    const tick = async () => {
      if (Date.now() - startedAt > 5 * 60_000) {
        stopPolling();
        setError('WhatsApp did not confirm in time. Request a new code and try again.');
        updateStatus('error');
        return;
      }
      try {
        const res = await fetch(`${getApiBaseUrl()}/wa/status/${userId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.linked && !data.connecting && data.phone) {
          stopPolling();
          handleEvent('connected', { phone: data.phone }, () => {});
        } else if (data.linked) {
          setPaired(true);
        } else if (!data.pairing) {
          stopPolling();
          setError('Pairing stopped before WhatsApp confirmed. Request a new code.');
          setPairingCode(null);
          updateStatus('error');
        }
      } catch {
        // Server briefly unreachable — keep trying until the deadline.
      }
    };
    pollRef.current = setInterval(tick, 3000);
    void tick();
  }

  async function initModal() {
    updateStatus('connecting');
    setPairingCode(null);
    setError(null);

    try {
      const res = await fetch(`${getApiBaseUrl()}/wa/status/${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.linked && data.phone) {
          setPhone(data.phone);
          updateStatus('linked');
          if (onLinked) onLinked(data.phone);
          return;
        }
      }
    } catch {
      // Fall through to the number form
    }

    // Not linked — pairing needs the user's number first.
    updateStatus('idle');
  }

  /** Shared handler for SSE events from either transport. */
  function handleEvent(eventType: string, data: any, close: () => void) {
    if (eventType === 'pairing_code' || eventType === 'connected' || eventType === 'error') {
      clearCodeTimeout();
    }
    if (eventType === 'pairing_code' && data.code) {
      hasCodeRef.current = true;
      setPaired(false);
      setPairingCode(data.code);
      updateStatus('connecting');
    } else if (eventType === 'status' && data.stage === 'paired') {
      setPaired(true);
    } else if (eventType === 'connected') {
      stopPolling();
      setPhone(data.phone ?? null);
      setPairingCode(null);
      setPaired(false);
      updateStatus('linked');
      close();
      if (onLinked && data.phone) onLinked(data.phone);
    } else if (eventType === 'error') {
      stopPolling();
      setError(data.error ?? 'Connection failed');
      setPairingCode(null);
      setPaired(false);
      updateStatus('error');
      close();
    }
  }

  function startLinking() {
    const normalized = normalizePhone(phoneInput);
    if (!normalized) {
      setPhoneError('Enter your WhatsApp number, e.g. 0300 1234567 or +92 300 1234567');
      updateStatus('idle');
      return;
    }
    setPhoneError(null);
    cleanup();
    hasCodeRef.current = false;
    setPaired(false);
    updateStatus('connecting');
    setPairingCode(null);
    setError(null);

    const url = `${getApiBaseUrl()}/wa/link/${userId}?phone=${encodeURIComponent(normalized)}`;

    codeTimeoutRef.current = setTimeout(() => {
      codeTimeoutRef.current = null;
      if (statusRef.current !== 'connecting') return;
      cleanup();
      setError(
        "The server didn't send a pairing code. Restart the backend so it runs the latest build, then try again."
      );
      updateStatus('error');
    }, 25000);

    // On Web, use browser EventSource if available
    if (typeof (globalThis as any).EventSource !== 'undefined') {
      const es = new (globalThis as any).EventSource(url);
      esRef.current = es;
      const close = () => es.close();

      for (const name of ['pairing_code', 'status', 'connected']) {
        es.addEventListener(name, (e: { data: string }) => {
          try {
            handleEvent(name, JSON.parse(e.data), close);
          } catch {}
        });
      }

      // Server-sent `error` events carry data; native connection errors don't.
      es.addEventListener('error', (e: { data?: string }) => {
        if (!e.data) return;
        try {
          handleEvent('error', JSON.parse(e.data), close);
        } catch {
          handleEvent('error', {}, close);
        }
      });

      es.onerror = (e: { data?: string }) => {
        if (e?.data) return;
        onTransportLost();
      };
      return;
    }

    // On React Native (mobile), EventSource is undefined on globalThis.
    // Use XMLHttpRequest streaming to parse SSE chunks safely.
    try {
      const xhr = new XMLHttpRequest();
      esRef.current = { close: () => xhr.abort() };
      const close = () => xhr.abort();

      let lastIndex = 0;
      let buffer = '';

      const processBuffer = () => {
        const text = xhr.responseText || '';
        if (text.length <= lastIndex) return;
        buffer += text.substring(lastIndex);
        lastIndex = text.length;

        // SSE event messages are delimited by double newline \n\n
        let boundaryIndex: number;
        while ((boundaryIndex = buffer.indexOf('\n\n')) !== -1) {
          const eventBlock = buffer.substring(0, boundaryIndex);
          buffer = buffer.substring(boundaryIndex + 2);

          let eventType = 'message';
          let dataStr = '';
          for (const line of eventBlock.split(/\r?\n/)) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(':')) continue; // Skip comments/keepalives
            if (trimmed.startsWith('event:')) {
              eventType = trimmed.replace(/^event:\s*/, '').trim();
            } else if (trimmed.startsWith('data:')) {
              dataStr += trimmed.replace(/^data:\s*/, '');
            }
          }

          if (dataStr) {
            try {
              handleEvent(eventType, JSON.parse(dataStr), close);
            } catch (parseErr) {
              console.warn('[WhatsAppLinkModal] Error parsing SSE payload:', parseErr);
            }
          }
        }
      };

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 3 || xhr.readyState === 4) processBuffer();
      };
      xhr.onprogress = processBuffer;
      // Stream ended or failed without a final event (iOS idle timeout, Wi-Fi
      // hiccup, server restart) — hand over to status polling.
      xhr.onload = () => {
        processBuffer();
        onTransportLost();
      };
      xhr.onerror = onTransportLost;
      xhr.ontimeout = onTransportLost;

      xhr.open('GET', url);
      xhr.setRequestHeader('Accept', 'text/event-stream');
      xhr.setRequestHeader('Cache-Control', 'no-cache');
      xhr.send();
    } catch (err: any) {
      setError(err?.message || 'Failed to initialize connection');
      updateStatus('error');
    }
  }

  async function handleUnlink() {
    try {
      await fetch(`${getApiBaseUrl()}/wa/link/${userId}`, { method: 'DELETE' });
      updateStatus('idle');
      setPhone(null);
      setPairingCode(null);
      if (onUnlinked) onUnlinked();
    } catch {
      setError('Failed to unlink');
    }
  }

  function backToNumber() {
    cleanup();
    setPairingCode(null);
    setError(null);
    updateStatus('idle');
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
        keyboardShouldPersistTaps="handled"
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
            <View style={styles.linkedActions}>
              <Button
                label="Unlink Account"
                icon={Link2Off}
                variant="danger"
                size="md"
                onPress={handleUnlink}
                style={styles.linkedBtn}
              />
            </View>
          </View>
        ) : null}

        {/* ── step 1: number ── */}
        {status === 'idle' ? (
          <View style={styles.linkContainer}>
            <TextField
              label="Your WhatsApp number"
              hint="The number on the phone you'll link. Include the country code if outside Pakistan."
              error={phoneError}
              value={phoneInput}
              onChangeText={(next) => {
                setPhoneInput(next);
                if (phoneError) setPhoneError(null);
              }}
              placeholder="0300 1234567"
              icon={PhoneIcon}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              returnKeyType="done"
              onSubmitEditing={startLinking}
            />
            <Button
              label="Get Pairing Code"
              variant="primary"
              size="lg"
              onPress={startLinking}
              fullWidth
            />
          </View>
        ) : null}

        {/* ── step 2: pairing code ── */}
        {status === 'connecting' ? (
          <View style={styles.linkContainer}>
            {pairingCode ? (
              <>
                <View style={styles.codeSection}>
                  <Text style={[TYPE.overline, styles.codeLabel]}>Your pairing code</Text>
                  <View
                    style={styles.codeFrame}
                    accessible
                    accessibilityLabel={`Pairing code ${pairingCode.split('').join(' ')}`}
                  >
                    <Text selectable style={styles.codeText}>{pairingCode}</Text>
                  </View>
                  <Text style={[TYPE.caption, styles.hint]}>
                    {paired
                      ? 'Code accepted — finishing login with WhatsApp…'
                      : 'Waiting for you to enter it in WhatsApp…'}
                  </Text>
                </View>

                <View style={styles.stepsCard}>
                  <Text style={[TYPE.label, styles.stepsTitle]}>Enter the code in WhatsApp:</Text>

                  <View style={styles.stepRow}>
                    <View style={styles.stepBadge}><Text style={styles.stepNum}>1</Text></View>
                    <Text style={styles.stepText}>Open <Text style={styles.boldText}>WhatsApp</Text> on the phone with this number</Text>
                  </View>

                  <View style={styles.stepRow}>
                    <View style={styles.stepBadge}><Text style={styles.stepNum}>2</Text></View>
                    <Text style={styles.stepText}>Tap <Text style={styles.boldText}>Menu ⋮</Text> or <Text style={styles.boldText}>Settings ⚙</Text> → <Text style={styles.boldText}>Linked Devices</Text> → <Text style={styles.boldText}>Link a Device</Text></Text>
                  </View>

                  <View style={styles.stepRow}>
                    <View style={styles.stepBadge}><Text style={styles.stepNum}>3</Text></View>
                    <Text style={styles.stepText}>Tap <Text style={styles.boldText}>Link with phone number instead</Text> and type the code above</Text>
                  </View>
                </View>

                <View style={styles.linkedActions}>
                  <Button
                    label="Change Number"
                    variant="secondary"
                    size="sm"
                    onPress={backToNumber}
                    style={styles.linkedBtn}
                  />
                  <Button
                    label="New Code"
                    variant="secondary"
                    size="sm"
                    onPress={startLinking}
                    style={styles.linkedBtn}
                  />
                </View>
              </>
            ) : (
              <View style={styles.center}>
                <ActivityIndicator size="large" color="#25D366" />
                <Text style={[TYPE.caption, styles.hint]}>Getting your pairing code…</Text>
              </View>
            )}
          </View>
        ) : null}

        {/* ── error ── */}
        {status === 'error' ? (
          <View style={styles.errorCard}>
            <Text style={[TYPE.body, styles.errorText]}>{error}</Text>
            <View style={styles.linkedActions}>
              <Button
                label="Change Number"
                variant="secondary"
                size="sm"
                onPress={backToNumber}
                style={styles.linkedBtn}
              />
              <Button
                label="Try Again"
                variant="secondary"
                size="sm"
                onPress={startLinking}
                style={styles.linkedBtn}
              />
            </View>
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
    borderRadius: RADIUS.md,
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
  linkedActions: {
    flexDirection: 'row',
    gap: SPACE.sm,
    width: '100%',
  },
  linkedBtn: {
    flex: 1,
  },
  // number form, code & instructions
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
    borderRadius: 6,
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
  codeSection: {
    alignItems: 'center',
    gap: SPACE.md,
  },
  codeLabel: {
    color: COLORS.textMuted,
  },
  codeFrame: {
    paddingVertical: SPACE.lg,
    paddingHorizontal: SPACE.xl,
    borderRadius: RADIUS.xl,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#25D366',
  },
  codeText: {
    ...TYPE.title1,
    color: COLORS.textPrimary,
    fontWeight: '800',
    letterSpacing: 4,
    fontVariant: ['tabular-nums'],
  },
  hint: {
    color: COLORS.textMuted,
    textAlign: 'center',
    maxWidth: 280,
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
  // misc
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACE.xxl,
    gap: SPACE.md,
  },
});
