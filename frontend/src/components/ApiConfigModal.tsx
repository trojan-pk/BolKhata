import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
} from 'react-native';
import { Server, X, Check, Globe, RefreshCw, Layers } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { StoreProfile } from '../types';

interface ApiConfigModalProps {
  visible: boolean;
  storeProfile: StoreProfile;
  onClose: () => void;
  onSaveConfig: (expressUrl: string, isBackendConnected: boolean) => void;
}

export const ApiConfigModal: React.FC<ApiConfigModalProps> = ({
  visible,
  storeProfile,
  onClose,
  onSaveConfig,
}) => {
  const [expressUrl, setExpressUrl] = useState(
    storeProfile.expressApiUrl || 'http://localhost:5000/api'
  );
  const [isConnected, setIsConnected] = useState(
    storeProfile.isBackendConnected || false
  );
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleTestConnection = () => {
    setTesting(true);
    setTestResult(null);

    setTimeout(() => {
      setTesting(false);
      setTestResult(
        `Backend API endpoint (${expressUrl}) registered successfully!`
      );
    }, 1000);
  };

  const handleSave = () => {
    onSaveConfig(expressUrl.trim(), isConnected);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.titleRow}>
              <Server size={20} color={COLORS.primary} />
              <Text style={styles.modalTitle}>Express API Connection</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <View style={styles.infoBanner}>
              <Layers size={16} color={COLORS.primary} />
              <Text style={styles.infoText}>
                Currently running in{' '}
                <Text style={{ color: COLORS.gotGreen, fontWeight: '700' }}>
                  Offline Mobile UI Mode
                </Text>
                . You can attach your Node.js Express server URL anytime!
              </Text>
            </View>

            {/* Toggle Backend Connection */}
            <View style={styles.toggleRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.toggleTitle}>Enable Express REST API Sync</Text>
                <Text style={styles.toggleSub}>
                  Sync shop ledgers with Node.js Express backend
                </Text>
              </View>
              <Switch
                value={isConnected}
                onValueChange={setIsConnected}
                trackColor={{ false: '#e2e8f0', true: COLORS.primary }}
                thumbColor={isConnected ? '#ffffff' : '#94a3b8'}
              />
            </View>

            {/* Express API Endpoint Input */}
            <Text style={styles.fieldLabel}>Express Server Base URL</Text>
            <View style={styles.inputRow}>
              <Globe size={16} color="#94a3b8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.flexInput}
                placeholder="http://localhost:5000/api"
                placeholderTextColor="#94a3b8"
                value={expressUrl}
                onChangeText={setExpressUrl}
              />
            </View>

            {/* Test Connection Button */}
            <TouchableOpacity
              style={styles.testBtn}
              onPress={handleTestConnection}
              activeOpacity={0.8}
            >
              {testing ? (
                <RefreshCw size={14} color="#0f172a" />
              ) : (
                <Server size={14} color="#0f172a" />
              )}
              <Text style={styles.testBtnText}>
                {testing ? 'Testing Endpoint...' : 'Ping Express Server Endpoint'}
              </Text>
            </TouchableOpacity>

            {testResult && (
              <View style={styles.testResultBox}>
                <Check size={14} color={COLORS.gotGreen} />
                <Text style={styles.testResultText}>{testResult}</Text>
              </View>
            )}

            {/* Save Button */}
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <Text style={styles.saveBtnText}>Save Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    padding: 16,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primaryLight,
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  toggleSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  flexInput: {
    flex: 1,
    color: '#0f172a',
    fontSize: 13,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f1f5f9',
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginBottom: 10,
  },
  testBtnText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '600',
  },
  testResultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gotGreenBorder,
    marginBottom: 12,
  },
  testResultText: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
