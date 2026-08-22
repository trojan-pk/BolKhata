import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Store, Wifi, Settings as SettingsIcon } from 'lucide-react-native';
import { FONTS } from '../theme/typography';
import { StoreProfile } from '../types';

interface HeaderProps {
  storeProfile: StoreProfile;
  onOpenVoice?: () => void;
  onOpenApiConfig?: () => void;
  onToggleSearch?: () => void;
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  storeProfile,
  onOpenApiConfig,
  onOpenSettings,
}) => {
  return (
    <View style={styles.headerContainer}>
      {/* Store Identity */}
      <View style={styles.storeCol}>
        <View style={styles.storeIconBadge}>
          <Store size={18} color="#0f172a" />
        </View>
        <View style={styles.storeTextCol}>
          <View style={styles.storeNameRow}>
            <Text style={styles.storeTitle} numberOfLines={1}>
              {storeProfile.name || 'BolKhata'}
            </Text>
            {/* Live Cloud Status Dot */}
            <View style={styles.liveStatusBadge}>
              <View style={styles.liveGreenDot} />
              <Text style={styles.liveStatusText}>Live</Text>
            </View>
          </View>
          <Text style={styles.ownerText} numberOfLines={1}>
            {storeProfile.ownerName || 'Shopkeeper Ledger'}
          </Text>
        </View>
      </View>

      {/* Right Controls */}
      <View style={styles.rightActionsRow}>
        {onOpenApiConfig && (
          <TouchableOpacity
            style={styles.actionIconButton}
            onPress={onOpenApiConfig}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Wifi size={16} color="#475569" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    width: '100%',
  },
  storeCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  storeIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeTextCol: {
    flex: 1,
  },
  storeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  storeTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  liveStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  liveGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  liveStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  ownerText: {
    fontFamily: FONTS.bodyRegular,
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
