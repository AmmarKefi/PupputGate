import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { HomeConcept } from '@/features/home/HomeConcept';
import { PRODUCTION_CONCEPT } from '@/features/home/types';
import { MerchantHome } from '@/features/merchant/MerchantHome';

/**
 * Home tab, per role: customers discover shops, professionals land on their
 * "Aujourd'hui" overview, administrators go straight to the console.
 */
export default function Home() {
  const { user } = useAuth();
  if (user?.role === 'MERCHANT') return <MerchantHome />;
  if (user?.role === 'ADMIN') return <Redirect href="/activity" />;
  return <HomeConcept concept={PRODUCTION_CONCEPT} guest={false} />;
}
