import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette, spacing } from '@/theme/tokens';
import { ConceptA } from './concepts/ConceptA';
import { ConceptB } from './concepts/ConceptB';
import { ConceptC } from './concepts/ConceptC';
import { ConceptD } from './concepts/ConceptD';
import { ConceptE } from './concepts/ConceptE';
import { HomeError, HomeLoading } from './components';
import { useHomeData } from './useHomeData';
import type { ConceptId, HomeConceptProps } from './types';

const COMPONENTS: Record<ConceptId, React.ComponentType<HomeConceptProps>> = {
  A: ConceptA,
  B: ConceptB,
  C: ConceptC,
  D: ConceptD,
  E: ConceptE,
};

/**
 * Renders a homepage concept against real data.
 *
 * Loading and failure are handled once here so no concept invents placeholder
 * businesses while the API is slow or unreachable.
 */
export function HomeConcept({ concept, guest }: { concept: ConceptId; guest: boolean }) {
  const data = useHomeData();
  const Concept = COMPONENTS[concept];

  if (data.loading && data.businesses.length === 0) {
    return (
      <SafeAreaView edges={['top']} style={styles.safe}>
        <HomeLoading />
      </SafeAreaView>
    );
  }

  // A failed request is not an empty catalogue: never show "nothing published"
  // when the truth is "we could not load it".
  if (data.error && data.businesses.length === 0) {
    return (
      <SafeAreaView edges={['top']} style={styles.safe}>
        <HomeError error={data.error} onRetry={data.refetch} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.flex}>
      <Concept guest={guest} data={data} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.canvas },
  safe: { flex: 1, backgroundColor: palette.canvas, paddingTop: spacing.sm },
});
