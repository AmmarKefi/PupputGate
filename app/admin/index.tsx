import React from 'react';
import { Redirect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { BackHeader } from '@/components/BackHeader';
import { spacing } from '@/theme/tokens';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { AdminConsole } from '@/features/admin/AdminConsole';

export default function AdminScreen() {
  const { user, status } = useAuth();
  const { t } = useLocale();
  if (status === 'loading') return null;
  if (user?.role !== 'ADMIN') return <Redirect href="/(tabs)" />;
  return (
    <Screen edges={['top']}>
      <BackHeader title={t('admin.title')} />
      <Text variant="title" style={{ marginVertical: spacing.md }}>
        {t('admin.title')}
      </Text>
      <AdminConsole />
    </Screen>
  );
}
