import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Store, Mic, Search, Server, User } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { StoreProfile } from '../types';

interface HeaderProps {
  storeProfile: StoreProfile;
  onOpenVoice: () => void;
  onOpenApiConfig: () => void;
  onToggleSearch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  storeProfile,
  onOpenVoice,
  onOpenApiConfig,
  onToggleSearch,
}) => {
  return (
    <View style={styles.headerContainer}>
      {/* Store Identity & Profile */}
      <View style={styles.storeCol}>
        <View style={styles.storeNameRow}>
          <View style={styles.storeIconBadge}>
            <Store size={18} color="#ffffff" />
          </View>
          <View>
            <Text style={styles.storeTitle} numberOfLines={1}>
              {storeProfile.name}
            </Text>
            <View style={styles.ownerSubRow}>
              <User size={12} color="#94a3b8" />
              <Text style={styles.ownerText}>{storeProfile.ownerName}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Action Controls */}
      <View style={styles.actionsRow}>
        {/* Express Backend Connector Toggle */}
        <TouchableOpacity
          style={[
            styles.iconButton,
            storeProfile.isBackendConnected ? styles.apiConnectedBtn : styles.apiDisconnectedBtn,
          ]}
          onPress={onOpenApiConfig}
          activeOpacity={0.8}
        >
          <Server
            size={18}
            color={storeProfile.isBackendConnected ? COLORS.gotGreen : '#94a3b8'}
          />
        </TouchableOpacity>

        {/* Search */}
        {onToggleSearch && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onToggleSearch}
            activeOpacity={0.8}
          >
            <Search size={18} color="#e2e8f0" />
          </TouchableOpacity>
        )}

        {/* BolKhata Voice Entry Microphone Button */}
        <TouchableOpacity
          style={styles.voiceButton}
          onPress={onOpenVoice}
          activeOpacity={0.85}
        >
          <Mic size={18} color="#ffffff" strokeWidth={2.5} />
          <Text style={styles.voiceButtonText}>BolKhata</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  storeCol: {
    flex: 1,
  },
  storeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  storeIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  ownerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ownerText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  apiConnectedBtn: {
    borderColor: COLORS.gotGreen,
    backgroundColor: 'rgba(22, 163, 74, 0.15)',
  },
  apiDisconnectedBtn: {
    borderColor: '#334155',
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.gotGreen,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 12,
    shadowColor: COLORS.gotGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  voiceButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
