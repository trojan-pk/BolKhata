import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AlertTriangle, Check, Info } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import {
  ELEV,
  MAX_CONTENT_WIDTH,
  MOTION,
  NO_OUTLINE,
  RADIUS,
  SPACE,
  TYPE,
} from '../theme/tokens';
import { Button } from './Button';
import { IconComponent } from './icon';
import { Sheet } from './Sheet';

/* ------------------------------------------------------------------ types -- */

type ToastTone = 'success' | 'error' | 'info';

interface ToastRequest {
  message: string;
  tone?: ToastTone;
}

interface ConfirmRequest {
  title: string;
  body?: string;
  /** Label on the confirming button. */
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface FeedbackApi {
  /** Transient confirmation of something that already happened. */
  toast: (message: string, tone?: ToastTone) => void;
  /** Blocking yes/no. Resolves `true` only if the user confirms. */
  confirm: (request: ConfirmRequest) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackApi>({
  toast: () => {},
  confirm: async () => false,
});

/** Replaces `alert()` / `window.confirm()` everywhere in the app. */
export const useFeedback = () => useContext(FeedbackContext);

/* ------------------------------------------------------------------ toast -- */

const TOAST_TONES: Record<ToastTone, { icon: IconComponent; tint: string }> = {
  success: { icon: Check, tint: '#5FE3A1' },
  error: { icon: AlertTriangle, tint: '#FF9C8F' },
  info: { icon: Info, tint: '#A9B4FF' },
};

const Toast: React.FC<{ request: ToastRequest; onDismiss: () => void }> = ({
  request,
  onDismiss,
}) => {
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;
  const { icon: Icon, tint } = TOAST_TONES[request.tone || 'info'];

  useEffect(() => {
    Animated.spring(progress, {
      toValue: 1,
      friction: 18,
      tension: 170,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(progress, {
        toValue: 0,
        duration: MOTION.fast + 40,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished }) => finished && onDismiss());
    }, 2600);

    return () => clearTimeout(timer);
    // A new request remounts this component, so binding once is correct.
  }, []);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.toastLayer,
        { paddingTop: insets.top + SPACE.sm },
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [-24, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Pressable
        onPress={onDismiss}
        accessibilityRole="alert"
        accessibilityLabel={request.message}
        style={[styles.toast, ELEV.raised, NO_OUTLINE]}
      >
        <Icon size={16} color={tint} strokeWidth={2.4} />
        <Text style={[TYPE.label, styles.toastText]} numberOfLines={2}>
          {request.message}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

/* --------------------------------------------------------------- provider -- */

/**
 * Hosts the toast layer and the confirm dialog above the whole app. Mount once,
 * near the root, outside the screen tree so neither can be clipped by a screen's
 * own layout.
 */
export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toastRequest, setToastRequest] = useState<
    (ToastRequest & { id: number }) | null
  >(null);
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null);
  const resolverRef = useRef<((ok: boolean) => void) | null>(null);
  const nextId = useRef(0);

  const toast = useCallback((message: string, tone: ToastTone = 'success') => {
    nextId.current += 1;
    setToastRequest({ message, tone, id: nextId.current });
  }, []);

  const confirm = useCallback((request: ConfirmRequest) => {
    // Settle any dialog still waiting, so a resolver is never orphaned.
    resolverRef.current?.(false);
    setConfirmRequest(request);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const settle = useCallback((ok: boolean) => {
    setConfirmRequest(null);
    const resolve = resolverRef.current;
    resolverRef.current = null;
    resolve?.(ok);
  }, []);

  const api = useMemo<FeedbackApi>(() => ({ toast, confirm }), [toast, confirm]);

  return (
    <FeedbackContext.Provider value={api}>
      {children}

      {toastRequest ? (
        <Toast
          key={toastRequest.id}
          request={toastRequest}
          onDismiss={() => setToastRequest(null)}
        />
      ) : null}

      <Sheet
        visible={!!confirmRequest}
        onClose={() => settle(false)}
        variant="center"
        scrollable={false}
        showClose={false}
        title={confirmRequest?.title}
        footer={
          <View style={styles.confirmActions}>
            <Button
              label={confirmRequest?.cancelLabel || 'Cancel'}
              variant="secondary"
              onPress={() => settle(false)}
              style={styles.confirmBtn}
            />
            <Button
              label={confirmRequest?.confirmLabel || 'Confirm'}
              variant={confirmRequest?.destructive ? 'debit' : 'primary'}
              onPress={() => settle(true)}
              style={styles.confirmBtn}
            />
          </View>
        }
      >
        {/* Body goes in the content area, not the subtitle — a two-line clamp
            would truncate the explanation of a destructive action. */}
        {confirmRequest?.body ? (
          <Text style={[TYPE.bodySm, styles.confirmBody]}>{confirmRequest.body}</Text>
        ) : null}
      </Sheet>
    </FeedbackContext.Provider>
  );
};

const styles = StyleSheet.create({
  toastLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: SPACE.lg,
    zIndex: 1000,
    ...(Platform.OS === 'web' ? { position: 'fixed' as any } : null),
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    backgroundColor: COLORS.ink,
    borderRadius: RADIUS.md,
    paddingVertical: SPACE.md,
    paddingHorizontal: SPACE.lg,
    maxWidth: MAX_CONTENT_WIDTH - SPACE.xxl,
    width: '100%',
  },
  toastText: {
    flex: 1,
    color: COLORS.textOnInk,
    fontWeight: '600',
  },
  confirmActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    width: '100%',
    marginTop: SPACE.sm,
  },
  confirmBody: {
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  confirmBtn: {
    flex: 1,
  },
});
