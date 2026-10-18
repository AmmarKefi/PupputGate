import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BackHeader } from '@/components/BackHeader';
import { BusinessCard } from '@/components/BusinessCard';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { palette, spacing } from '@/theme/tokens';
import { useLocale } from '@/hooks/useLocale';
import { useQuery } from '@/hooks/useQuery';
import { api } from '@/lib/api';

export default function Favourites() {
  const router = useRouter();
  const { t } = useLocale();
  const { data, loading, error, refetch } = useQuery(() => api.favourites(), {});

  async function remove(id: string) {
    try {
      await api.removeFavourite(id);
      refetch();
    } catch {
      /* ignore */
    }
  }

  const businesses = data?.businesses ?? [];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.canvas }} edges={['top']}>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <BackHeader title={t('account.favourites')} />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.xl }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : businesses.length === 0 ? (
          <EmptyState icon="heart-outline" title={t('account.favourites')} hint={t('activity.emptyHint')} />
        ) : (
          businesses.map((b) => (
            <BusinessCard key={b.id} business={{ ...b, isFavourite: true }} onPress={() => router.push(`/business/${b.slug}`)} onToggleFavourite={() => remove(b.id)} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
