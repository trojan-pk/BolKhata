import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { User } from 'lucide-react-native';
import { FONTS } from '../theme/typography';
import { VoiceLogo } from './VoiceLogo';
import { StoreProfile } from '../types';

interface HeaderProps {
  storeProfile: StoreProfile;
  onOpenVoice?: () => void;
  onOpenApiConfig?: () => void;
  onToggleSearch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ storeProfile }) => {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.storeCol}>
        <View style={styles.storeNameRow}>
          <View style={styles.storeIconBadge}>
            <VoiceLogo size={20} color="#000000" animated={false} />
          </View>
          <View style={{ flex: 1, flexShrink: 1 }}>
            <Text style={styles.storeTitle} numberOfLines={1}>
              {storeProfile.name}
            </Text>
            <View style={styles.ownerSubRow}>
              <User size={10} color="#64748b" />
              <Text style={styles.ownerText} numberOfLines={1}>
                {storeProfile.ownerName}
              </Text>
            </View>
          </View>
        </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    width: '100%',
  },
  storeCol: {
    flex: 1,
    flexShrink: 1,
  },
  storeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  storeIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  ownerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  ownerText: {
    fontFamily: FONTS.bodyRegular,
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
});
