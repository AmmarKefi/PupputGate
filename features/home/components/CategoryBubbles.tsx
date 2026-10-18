import React, { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useWindowDimensions, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { CategoryGlyph } from './CategoryGlyph';
import { palette, spacing } from '@/theme/tokens';
import { useLayoutWidth } from '@/features/home/layout';
import type { Category } from '@/types';

/**
 * Photo-led collage inspired by the reference home. These are generic category
 * illustrations only, never presented as photos of specific Hammamet shops.
 */

/** Bubble centers/diameters compose an intentionally varied phone-sized collage. */
const BUBBLES = [
  { x: 150, y: 104, size: 178 },
  { x: 310, y: 224, size: 138 },
  { x: -18, y: 236, size: 190 },
  { x: 190, y: 316, size: 108 },
  { x: 424, y: 112, size: 130 },
  { x: 82, y: 365, size: 126 },
  { x: 342, y: 378, size: 146 },
  { x: -12, y: 420, size: 128 },
  { x: 218, y: 446, size: 148 },
  { x: 434, y: 474, size: 118 },
  { x: 91, y: 500, size: 112 },
  { x: 566, y: 236, size: 132 },
  { x: 536, y: 392, size: 112 },
];

/** Width of the collage artboard (scrolls sideways on phones). */
const ART_W = 660;

/** Entrance spring + a slow, offset bob so the collage feels alive but calm. */
function FloatingBubble({
  index,
  style,
  children,
}: {
  index: number;
  style: object;
  children: React.ReactNode;
}) {
  const bob = useSharedValue(0);
  const enter = useSharedValue(0);
  useEffect(() => {
    enter.value = withDelay(index * 55, withSpring(1, { damping: 13, stiffness: 140 }));
    bob.value = withDelay(
      index * 230,
      withRepeat(withTiming(1, { duration: 2600 + (index % 4) * 450, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
  }, [bob, enter, index]);
  const anim = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: (bob.value - 0.5) * (index % 2 ? 7 : -7) }, { scale: 0.7 + enter.value * 0.3 }],
  }));
  return <Animated.View style={[{ position: 'absolute' }, style, anim]}>{children}</Animated.View>;
}

export function CategoryBubbles({
  categories,
  categoryName,
  onSelect,
}: {
  categories: Category[];
  categoryName: (c: Category) => string;
  onSelect: (slug: string) => void;
}) {
  const layoutWidth = useLayoutWidth();
  const { width: physicalWidth } = useWindowDimensions();
  const width = Math.max(layoutWidth, physicalWidth);
  const scale = width < 700 ? Math.min(1, Math.max(0.84, width / 390)) : 1;
  const artboardWidth = Math.max(width, ART_W * scale);
  const offset = Math.max(0, (artboardWidth - ART_W * scale) / 2);
  const artboardHeight = 455 * scale;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ height: artboardHeight, marginHorizontal: -spacing.xl }}
      contentContainerStyle={{ width: artboardWidth, height: artboardHeight }}
      accessibilityLabel="Catégories de commerces"
    >
      <View style={[styles.artboard, { width: artboardWidth, height: artboardHeight }]}>
        {categories.slice(0, BUBBLES.length).map((category, index) => {
          const bubble = BUBBLES[index];
          const size = bubble.size * scale;
          return (
            <FloatingBubble
              key={category.id}
              index={index}
              style={{
                width: size,
                height: size,
                left: offset + bubble.x * scale - size / 2,
                top: bubble.y * scale - size / 2,
                zIndex: BUBBLES.length - index,
              }}
            >
            <Pressable
              onPress={() => onSelect(category.slug)}
            accessibilityRole="button"
            accessibilityLabel={categoryName(category)}
            style={({ pressed }) => [
                styles.bubble,
                { width: size, height: size, borderRadius: size / 2, left: 0, top: 0 },
                pressed && styles.pressed,
              ]}
            >
              <View pointerEvents="none" style={[styles.under, { borderRadius: size / 2, height: size - 10 }]} />
              <View style={[styles.circle, { borderRadius: size / 2 }]}>
                {/* Icon and label form one centred group: the label sits right under the icon. */}
                <View style={styles.group}>
                  <CategoryGlyph slug={category.slug} size={size * 0.44} />
                  <Text
                    variant="meta"
                    center
                    numberOfLines={2}
                    style={[
                      styles.label,
                      {
                        fontSize: size < 120 ? 10 : size < 150 ? 11.5 : 12.5,
                        lineHeight: size < 120 ? 12 : size < 150 ? 14 : 15,
                        marginTop: size < 120 ? 1 : 3,
                        maxWidth: size * 0.78,
                      },
                    ]}
                  >
                    {categoryName(category)}
                  </Text>
                </View>
              </View>
            </Pressable>
            </FloatingBubble>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  artboard: { position: 'relative', overflow: 'hidden' },
  bubble: { position: 'absolute', padding: 5 },
  // Gray crescent peeking out below each circle (the reference's soft 3D edge).
  under: {
    position: 'absolute',
    left: 5,
    right: 5,
    top: 12,
    backgroundColor: '#B9C4C2',
  },
  circle: {
    flex: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.white,
    borderWidth: 4,
    borderColor: palette.white,
  },
  group: { alignItems: 'center', justifyContent: 'center' },
  label: { color: '#111817', fontWeight: '700' },
  pressed: { transform: [{ scale: 0.95 }], opacity: 0.92 },
});
