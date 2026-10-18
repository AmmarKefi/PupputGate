import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BackHeader } from '@/components/BackHeader';
import { Card } from '@/components/Card';
import { Text } from '@/components/Text';
import { EmptyState, LoadingState } from '@/components/states';
import { palette, spacing } from '@/theme/tokens';
import { useLocale } from '@/hooks/useLocale';
import { useQuery } from '@/hooks/useQuery';
import { api } from '@/lib/api';
import { translate, type TranslationKey } from '@/locales';

export default function Notifications() {
  const { t, locale } = useLocale();
  const { data, loading } = useQuery(() => api.notifications(), {});
  const items = data?.notifications ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.canvas }} edges={['top']}>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <BackHeader title={t('account.notifications')} />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.xl }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <LoadingState />
        ) : items.length === 0 ? (
          <EmptyState icon="notifications-outline" title={t('notif.empty')} />
        ) : (
          items.map((n) => (
            <Card key={n.id} style={styles.item}>
              <View style={styles.row}>
                <View style={styles.dot}>
                  <Ionicons name="notifications" size={16} color={palette.forest} />
                </View>
                <View style={{ flex: 1, marginHorizontal: spacing.md }}>
                  <Text variant="bodyStrong">{translate(locale, n.titleKey as TranslationKey)}</Text>
                  <Text variant="meta" muted>{translate(locale, n.bodyKey as TranslationKey)}</Text>
                </View>
                {!n.read ? <View style={styles.unread} /> : null}
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  item: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 36, height: 36, borderRadius: 18, backgroundColor: palette.mint, alignItems: 'center', justifyContent: 'center' },
  unread: { width: 9, height: 9, borderRadius: 5, backgroundColor: palette.terracotta },
});
