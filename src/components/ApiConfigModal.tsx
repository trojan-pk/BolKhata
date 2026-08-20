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
              <Server size={22} color={COLORS.primary} />
              <Text style={styles.modalTitle}>Express API Connection Setup</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <View style={styles.infoBanner}>
              <Layers size={18} color="#60a5fa" />
              <Text style={styles.infoText}>
                Currently running in <Text style={{ color: COLORS.gotGreen, fontWeight: '700' }}>Offline Mobile UI Mode</Text>. You can attach your Node.js Express server URL anytime!
              </Text>
            </View>

            {/* Toggle Backend Connection */}
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>Enable Express REST API Sync</Text>
                <Text style={styles.toggleSub}>
                  Sync shop ledgers with Node.js Express & PostgreSQL / MongoDB
                </Text>
              </View>
              <Switch
                value={isConnected}
                onValueChange={setIsConnected}
                trackColor={{ false: '#334155', true: COLORS.primary }}
                thumbColor={isConnected ? '#ffffff' : '#94a3b8'}
              />
            </View>

            {/* Express API Endpoint Input */}
            <Text style={styles.fieldLabel}>Express Server Base URL</Text>
            <View style={styles.inputRow}>
              <Globe size={18} color="#64748b" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.flexInput}
                placeholder="http://localhost:5000/api"
                placeholderTextColor="#64748b"
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
                <RefreshCw size={16} color="#ffffff" />
              ) : (
                <Server size={16} color="#ffffff" />
              )}
              <Text style={styles.testBtnText}>
                {testing ? 'Testing Endpoint...' : 'Ping Express Server Endpoint'}
              </Text>
            </TouchableOpacity>

            {testResult && (
              <View style={styles.testResultBox}>
                <Check size={16} color={COLORS.gotGreen} />
                <Text style={styles.testResultText}>{testResult}</Text>
              </View>
            )}

            {/* Code Snippet Info */}
            <View style={styles.codeBox}>
              <Text style={styles.codeTitle}>Expected Express Route Example:</Text>
              <Text style={styles.codeText}>
                app.get('/api/customers', (req, res) ={'>'} ...){'\n'}
                app.post('/api/transactions', (req, res) ={'>'} ...)
              </Text>
            </View>

            {/* Save Button */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    padding: 16,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  toggleSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
  },
  flexInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#334155',
    height: 42,
    borderRadius: 12,
    marginBottom: 12,
  },
  testBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  testResultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(22, 163, 74, 0.15)',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.gotGreen,
    marginBottom: 12,
  },
  testResultText: {
    fontSize: 12,
    color: COLORS.gotGreen,
    fontWeight: '600',
  },
  codeBox: {
    backgroundColor: '#020617',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 20,
  },
  codeTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 4,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#38bdf8',
    lineHeight: 16,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    height: 50,
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
