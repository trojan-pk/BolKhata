import React, { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { Globe, Server, Wifi } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { COPY } from '../i18n/copy';
import { RADIUS, SPACE, TYPE } from '../theme/tokens';
import { StoreProfile } from '../types';
import { getApiBaseUrl } from '../services/api';
import { Badge, Button, Sheet, TextField, useFeedback } from '../ui';

type ProbeResult = { ok: boolean; detail: string } | null;

const PROBE_TIMEOUT_MS = 4000;

/**
 * Points the app at a server. The test button performs a real request with a
 * timeout — the previous build faked success after one second, which is worse
 * than no test at all.
 */
export const ApiConfigModal: React.FC<{
  visible: boolean;
  storeProfile: StoreProfile;
  onClose: () => void;
  onSaveConfig: (expressUrl: string, isBackendConnected: boolean) => void;
}> = ({ visible, storeProfile, onClose, onSaveConfig }) => {
  const { toast } = useFeedback();

  const [url, setUrl] = useState(storeProfile.expressApiUrl || getApiBaseUrl());
  const [enabled, setEnabled] = useState(!!storeProfile.isBackendConnected);
  const [probing, setProbing] = useState(false);
  const [probe, setProbe] = useState<ProbeResult>(null);

  useEffect(() => {
    if (visible) {
      setUrl(storeProfile.expressApiUrl || getApiBaseUrl());
      setEnabled(!!storeProfile.isBackendConnected);
      setProbe(null);
      setProbing(false);
    }
  }, [visible, storeProfile]);

  const testConnection = async () => {
    const target = url.trim().replace(/\/+$/, '');
    if (!target) {
      setProbe({ ok: false, detail: 'Enter a server address first' });
      return;
    }

    setProbing(true);
    setProbe(null);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

    try {
      const response = await fetch(target, {
        method: 'GET',
        signal: controller.signal,
      });
      // Any HTTP status means something is listening — that's what we're testing.
      setProbe({
        ok: true,
        detail: `${COPY.api.reachable} (HTTP ${response.status})`,
      });
    } catch {
      setProbe({ ok: false, detail: COPY.api.unreachable });
    } finally {
      clearTimeout(timer);
      setProbing(false);
    }
  };

  const save = () => {
    onSaveConfig(url.trim().replace(/\/+$/, ''), enabled);
    onClose();
    toast(COPY.api.savedToast);
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={COPY.api.title}
      subtitle={COPY.api.subtitle}
      footer={
        <Button
          label={COPY.common.save}
          variant="primary"
          size="lg"
          onPress={save}
          fullWidth
        />
      }
    >
      <View style={styles.toggleRow}>
        <View style={styles.toggleText}>
          <Text style={TYPE.label}>{COPY.api.toggleLabel}</Text>
          <Text style={[TYPE.caption, styles.toggleHint]}>{COPY.api.toggleHint}</Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={setEnabled}
          trackColor={{ false: COLORS.hairlineStrong, true: COLORS.accent }}
          thumbColor={COLORS.surface}
          accessibilityLabel={COPY.api.toggleLabel}
        />
      </View>

      <TextField
        label={COPY.api.urlLabel}
        value={url}
        onChangeText={(next) => {
          setUrl(next);
          setProbe(null);
        }}
        placeholder={COPY.api.urlPlaceholder}
        icon={Globe}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />

      <Button
        label={probing ? COPY.api.testing : COPY.api.test}
        icon={probing ? undefined : Wifi}
        variant="secondary"
        onPress={testConnection}
        loading={probing}
        fullWidth
      />

      {probe ? (
        <View
          style={[
            styles.result,
            probe.ok ? styles.resultOk : styles.resultFail,
          ]}
        >
          <Server
            size={15}
            color={probe.ok ? COLORS.creditStrong : COLORS.debitStrong}
            strokeWidth={2.2}
          />
          <Text
            style={[
              TYPE.caption,
              styles.resultText,
              { color: probe.ok ? COLORS.creditStrong : COLORS.debitStrong },
            ]}
          >
            {probe.detail}
          </Text>
        </View>
      ) : null}

      <View style={styles.statusRow}>
        <Badge
          label={enabled ? COPY.settings.connectionOn : COPY.settings.connectionOff}
          tone={enabled ? 'credit' : 'neutral'}
          dot
        />
      </View>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.md,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.md,
    padding: SPACE.lg - 2,
  },
  toggleText: {
    flex: 1,
    gap: 2,
  },
  toggleHint: {
    color: COLORS.textMuted,
  },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    padding: SPACE.md,
  },
  resultOk: {
    backgroundColor: COLORS.creditSoft,
    borderColor: COLORS.creditBorder,
  },
  resultFail: {
    backgroundColor: COLORS.debitSoft,
    borderColor: COLORS.debitBorder,
  },
  resultText: {
    flex: 1,
    fontWeight: '600',
  },
  statusRow: {
    alignItems: 'flex-start',
  },
});
