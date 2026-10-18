import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { spacing } from '@/theme/tokens';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { CustomerActivity } from '@/features/activity/CustomerActivity';
import { MerchantDashboard, type QueueSeg } from '@/features/merchant/MerchantDashboard';
import { AdminConsole } from '@/features/admin/AdminConsole';

export default function ActivityTab() {
  const { user } = useAuth();
  const { t } = useLocale();
  const { seg } = useLocalSearchParams<{ seg?: string }>();
  const initialSeg: QueueSeg =
    seg === 'orders' || seg === 'quotes' || seg === 'storefront' ? seg : 'appointments';
  const title =
    user?.role === 'MERCHANT' ? t('merchant.manage') : user?.role === 'ADMIN' ? t('admin.title') : t('activity.title');

  return (
    <Screen>
      <Text variant="title" style={{ marginTop: spacing.sm, marginBottom: spacing.md }}>
        {title}
      </Text>
      {user?.role === 'MERCHANT' ? (
        <MerchantDashboard initialSeg={initialSeg} />
      ) : user?.role === 'ADMIN' ? (
        <AdminConsole />
      ) : (
        <CustomerActivity />
      )}
    </Screen>
  );
}
