import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { useLocale } from '@/hooks/useLocale';
import { useBottomSpace } from '@/hooks/useBottomSpace';
import { palette, radius, spacing } from '@/theme/tokens';
import { CategoryGlyph } from './CategoryGlyph';
import { BusinessTile } from './BusinessTile';
import type { BusinessSummary } from '@/types';

/**
 * Bottom sheet that lists a category's shops without leaving Home. Opening a
 * shop goes to its page; "Explore" is offered but never forced.
 */
export function CategorySheet({
  slug,
  name,
  businesses,
  onClose,
  onOpenBusiness,
  onSeeAll,
}: {
  slug: string | null;
  name: string;
  businesses: BusinessSummary[];
  onClose: () => void;
  onOpenBusiness: (b: BusinessSummary) => void;
  onSeeAll: () => void;
}) {
  const { t, isRTL } = useLocale();
  const { height } = useWindowDimensions();
  const space = useBottomSpace();
  const visible = !!slug;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      {visible ? (
        <View style={styles.root}>
          <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(160)} style={styles.backdrop}>
            <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t('common.close')} />
          </Animated.View>

          <Animated.View
            entering={SlideInDown.springify().damping(22).stiffness(220)}
            exiting={SlideOutDown.duration(180)}
            style={[styles.sheet, { maxHeight: height * 0.82, paddingBottom: Math.max(space.system, spacing.lg) }]}
          >
            <View style={styles.grabber} />
            <View style={[styles.head, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <CategoryGlyph slug={slug!} size={52} />
              <View style={{ flex: 1, marginHorizontal: spacing.md }}>
                <Text variant="section" numberOfLines={2}>
                  {name}
                </Text>
                <Text variant="meta" muted>
                  {t('explore.resultsCount', { count: businesses.length })}
                </Text>
              </View>
              <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('common.close')} style={styles.close}>
                <Ionicons name="close" size={20} color={palette.ink} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
              {businesses.length === 0 ? (
                <View style={styles.empty}>
                  <Ionicons name="storefront-outline" size={30} color={palette.mutedText} />
                  <Text variant="bodyStrong" center style={{ marginTop: spacing.sm }}>
                    {t('explore.noResults')}
                  </Text>
                  <Text variant="meta" muted center style={{ marginTop: 2 }}>
                    {t('explore.noResultsHint')}
                  </Text>
                </View>
              ) : (
                businesses.map((b) => <BusinessTile key={b.id} business={b} variant="row" onPress={() => onOpenBusiness(b)} />)
              )}
            </ScrollView>

            <Button label={t('welcome.exploreCta')} variant="secondary" icon="compass-outline" onPress={onSeeAll} style={{ marginTop: spacing.md }} />
          </Animated.View>
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,40,36,0.5)' },
  sheet: {
    backgroundColor: palette.white,
    borderTopLeftRadius: radius.editorial + 6,
    borderTopRightRadius: radius.editorial + 6,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  grabber: { alignSelf: 'center', width: 46, height: 5, borderRadius: 3, backgroundColor: '#D3D9D8', marginBottom: spacing.md },
  head: { alignItems: 'center', marginBottom: spacing.sm },
  close: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#EEF3F3', alignItems: 'center', justifyContent: 'center' },
  list: { paddingBottom: spacing.sm },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl },
});
