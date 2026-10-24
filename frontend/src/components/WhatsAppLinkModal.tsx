import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WhatsAppIcon } from './WhatsAppIcon';
import { Link2Off, Phone as PhoneIcon, RefreshCw } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACE, TYPE } from '../theme/tokens';
import { Button, Press, TextField } from '../ui';
import { ApiService, getApiBaseUrl, getAuthHeaders } from '../services/api';

type WaStatus = 'idle' | 'connecting' | 'linked' | 'error';

interface Props {
  visible: boolean;
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

  /** Active event stream (fetch on web, XHR on native); `close` aborts it. */
  const streamRef = useRef<{ close: () => void } | null>(null);
  // Track status in a ref so async callbacks always read the latest value
  const statusRef = useRef<WaStatus>('idle');
  // Number this attempt is linking. A stale socket/event from the previously
  // linked number must never flip the UI back to "old number linked".
  const expectedPhoneRef = useRef<string | null>(null);
  // Invalidates the /wa/status request fired when the modal opened. Without
  // this, a slow response can land after the user has already started pairing
  // and put the previous "Linked: +old number" card back on screen.
  const statusRequestRef = useRef(0);

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
  }, [visible]);

  useEffect(() => {
    if (defaultPhone && !phoneInput) setPhoneInput(defaultPhone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultPhone]);

  function closeStream() {
    const stream = streamRef.current;
    streamRef.current = null;
    stream?.close();
  }

  function cleanup() {
    statusRequestRef.current += 1;
    clearCodeTimeout();
    stopPolling();
    closeStream();
  }

  // If no code arrives, say so instead of spinning forever (e.g. the server is
  // an old build, or WhatsApp is unreachable from it).
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
    // Deliberately not reconnecting the stream: a new /wa/link request would
    // restart pairing and invalidate the code the user is typing.
    streamRef.current = null;
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
        const res = await fetch(`${getApiBaseUrl()}/wa/status`, { headers: await getAuthHeaders() });
        if (!res.ok) return;
        const data = await res.json();
        // Ignore the previous login while the new pairing is still running.
        if (data.phone && expectedPhoneRef.current && data.phone !== expectedPhoneRef.current) return;
        if (data.linked && !data.connecting && data.phone) {
          stopPolling();
          handleEvent('connected', { phone: data.phone });
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
    const requestId = ++statusRequestRef.current;
    updateStatus('connecting');
    setPairingCode(null);
    setError(null);

    try {
      const res = await fetch(`${getApiBaseUrl()}/wa/status`, { headers: await getAuthHeaders() });
      // The user may have clicked "Change Number" / started pairing while this
      // request was in flight; its answer is now stale.
      if (requestId !== statusRequestRef.current) return;
      if (res.status === 401) {
        setError('Your session has expired. Sign in again to link WhatsApp.');
        updateStatus('error');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (requestId !== statusRequestRef.current) return;
        if (data.linked && data.phone) {
          setPhone(data.phone);
          updateStatus('linked');
          if (onLinked) onLinked(data.phone);
          return;
        }
      }
    } catch {
      if (requestId !== statusRequestRef.current) return;
      // Fall through to the number form
    }

    // Not linked — pairing needs the user's number first.
    updateStatus('idle');
  }

  /** Shared handler for SSE events from either transport. */
  function handleEvent(eventType: string, data: any) {
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
      // A late event from the socket we just replaced can still carry the old
      // number. Ignore it — this attempt is pairing a different one.
      if (expectedPhoneRef.current && data.phone && data.phone !== expectedPhoneRef.current) return;
      const linkedPhone = data.phone ?? expectedPhoneRef.current;
      stopPolling();
      closeStream();
      expectedPhoneRef.current = linkedPhone;
      setPhone(linkedPhone);
      setPairingCode(null);
      setPaired(false);
      updateStatus('linked');
      if (onLinked && linkedPhone) onLinked(linkedPhone);
    } else if (eventType === 'error') {
      stopPolling();
      closeStream();
      setError(data.error ?? 'Connection failed');
      setPairingCode(null);
      setPaired(false);
      updateStatus('error');
    }
  }

  /** Incremental SSE parser: feed it raw text chunks, it dispatches events. */
  function makeSseParser() {
    let buffer = '';
    return (chunk: string) => {
      buffer += chunk.replace(/\r\n/g, '\n');
      // SSE event blocks are delimited by a blank line
      let boundary: number;
      while ((boundary = buffer.indexOf('\n\n')) !== -1) {
        const block = buffer.substring(0, boundary);
        buffer = buffer.substring(boundary + 2);
        let eventType = 'message';
        let dataStr = '';
        for (const line of block.split('\n')) {
          if (!line || line.startsWith(':')) continue; // comments / heartbeats
          if (line.startsWith('event:')) eventType = line.slice(6).trim();
          else if (line.startsWith('data:')) dataStr += line.slice(5).trim();
        }
        if (!dataStr) continue;
        try {
          handleEvent(eventType, JSON.parse(dataStr));
        } catch (parseErr) {
          console.warn('[WhatsAppLinkModal] Error parsing SSE payload:', parseErr);
        }
      }
    };
  }

  /**
   * Web: `fetch` with a streamed body. Browser `EventSource` can't send an
   * Authorization header, and the server identifies the user by that token.
   */
  function openFetchStream(url: string, headers: Record<string, string>) {
    const controller = new AbortController();
    streamRef.current = { close: () => controller.abort() };
    const feed = makeSseParser();

    (async () => {
      try {
        const res = await fetch(url, { headers, signal: controller.signal });
        if (res.status === 401) {
          handleEvent('error', { error: 'Your session has expired. Sign in again to link WhatsApp.' });
          return;
        }
        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          feed(decoder.decode(value, { stream: true }));
        }
        // Server closed the stream without a final event.
        if (!controller.signal.aborted) onTransportLost();
      } catch {
        if (!controller.signal.aborted) onTransportLost();
      }
    })();
  }

  /** Native: XMLHttpRequest exposes the response progressively and takes headers. */
  function openXhrStream(url: string, headers: Record<string, string>) {
    const xhr = new XMLHttpRequest();
    let aborted = false;
    streamRef.current = {
      close: () => {
        aborted = true;
        xhr.abort();
      },
    };
    const feed = makeSseParser();
    let lastIndex = 0;

    const pump = () => {
      const text = xhr.responseText || '';
      if (text.length <= lastIndex) return;
      const chunk = text.substring(lastIndex);
      lastIndex = text.length;
      feed(chunk);
    };
    const lost = () => {
      if (!aborted) onTransportLost();
    };

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 3 || xhr.readyState === 4) pump();
    };
    xhr.onprogress = pump;
    // Stream ended or failed without a final event (iOS idle timeout, Wi-Fi
    // hiccup, server restart) — hand over to status polling.
    xhr.onload = () => {
      if (xhr.status === 401) {
        handleEvent('error', { error: 'Your session has expired. Sign in again to link WhatsApp.' });
        return;
      }
      pump();
      lost();
    };
    xhr.onerror = lost;
    xhr.ontimeout = lost;

    xhr.open('GET', url);
    xhr.setRequestHeader('Accept', 'text/event-stream');
    xhr.setRequestHeader('Cache-Control', 'no-cache');
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
    xhr.send();
  }

  async function startLinking() {
    const normalized = normalizePhone(phoneInput);
    if (!normalized) {
      setPhoneError('Enter your WhatsApp number, e.g. 0300 1234567 or +92 300 1234567');
      updateStatus('idle');
      return;
    }
    setPhoneError(null);
    cleanup();
    hasCodeRef.current = false;
    expectedPhoneRef.current = normalized;
    setPaired(false);
    setPhone(null);
    updateStatus('connecting');
    setPairingCode(null);
    setError(null);

    const headers = await getAuthHeaders();
    if (!headers.Authorization) {
      setError('Sign in again to link WhatsApp.');
      updateStatus('error');
      return;
    }

    const url = `${getApiBaseUrl()}/wa/link?phone=${encodeURIComponent(normalized)}&force=true`;

    codeTimeoutRef.current = setTimeout(() => {
      codeTimeoutRef.current = null;
      if (statusRef.current !== 'connecting' || hasCodeRef.current) return;
      cleanup();
      setError("The server didn't send a pairing code. Check the backend is running the latest build, then try again.");
      updateStatus('error');
    }, 25000);

    try {
      if (Platform.OS === 'web') openFetchStream(url, headers);
      else openXhrStream(url, headers);
    } catch (err: any) {
      clearCodeTimeout();
      setError(err?.message || 'Failed to initialize connection');
      updateStatus('error');
    }
  }

  async function handleUnlink() {
    cleanup();
    try {
      await ApiService.unlinkWa();
      expectedPhoneRef.current = null;
      updateStatus('idle');
      setPhone(null);
      setPhoneInput('');
      setPairingCode(null);
      if (onUnlinked) onUnlinked();
    } catch {
      setError('Failed to unlink');
      updateStatus('error');
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
                label="Change Number"
                icon={RefreshCw}
                variant="secondary"
                size="md"
                onPress={() => {
                  cleanup();
                  expectedPhoneRef.current = null;
                  setPhone(null);
                  setPhoneInput('');
                  setPhoneError(null);
                  setPairingCode(null);
                  setPaired(false);
                  setError(null);
                  updateStatus('idle');
                }}
                style={styles.linkedBtn}
              />
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
