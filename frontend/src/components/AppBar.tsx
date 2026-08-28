import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Settings as SettingsIcon } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { GUTTER, SPACE, TYPE } from '../theme/tokens';
import { StoreProfile } from '../types';
import { Avatar, Badge, IconButton, Press } from '../ui';

/**
 * Top bar. Identity on the left, state on the right — and the connection badge
 * reflects the actual sync setting rather than always claiming to be live.
 */
export const AppBar: React.FC<{
  storeProfile: StoreProfile;
  onOpenSettings: () => void;
  onPressIdentity?: () => void;
}> = ({ storeProfile, onOpenSettings, onPressIdentity }) => {
  const name = storeProfile.name?.trim() || 'BolKhata';
  const owner = storeProfile.ownerName?.trim();
  const synced = !!storeProfile.isBackendConnected;

  return (
    <View style={styles.bar}>
      <Press
        onPress={onPressIdentity}
        disabled={!onPressIdentity}
        scale={0.99}
        accessibilityLabel={`${name}${owner ? `, ${owner}` : ''}`}
        style={styles.identity}
      >
        <Avatar name={name} size={38} tone="ink" />
        <View style={styles.identityText}>
          <View style={styles.nameRow}>
            <Text style={[TYPE.title3, styles.name]} numberOfLines={1}>
              {name}
            </Text>
            {storeProfile.accountType === 'commercial' && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>
                  {storeProfile.businessCategory ? storeProfile.businessCategory.split(' ')[0] : '🏢'}
                </Text>
              </View>
            )}
          </View>
          <Text style={[TYPE.caption, styles.owner]} numberOfLines={1}>
            {owner
              ? `${owner} · ${storeProfile.accountType === 'personal' ? 'Personal' : 'Merchant'}`
              : 'Voice ledger'}
          </Text>
        </View>
      </Press>

      <View style={styles.actions}>
        <Badge
          label={synced ? 'Synced' : 'On device'}
          tone={synced ? 'credit' : 'neutral'}
          dot
        />
        <IconButton
          icon={SettingsIcon}
          onPress={onOpenSettings}
          accessibilityLabel="Open settings"
          variant="ghost"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.md,
    paddingHorizontal: GUTTER,
    paddingVertical: SPACE.md,
    backgroundColor: COLORS.paper,
  },
  identity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
  },
  identityText: {
    flex: 1,
    gap: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    color: COLORS.textPrimary,
  },
  categoryBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
  },
  owner: {
    color: COLORS.textMuted,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
});
