import React from 'react';
import { Text as RNText, type TextProps, type TextStyle } from 'react-native';
import { type } from '@/theme/tokens';
import { palette } from '@/theme/tokens';
import { useLocale } from '@/hooks/useLocale';

type Variant = keyof typeof type;

interface Props extends TextProps {
  variant?: Variant;
  color?: string;
  center?: boolean;
  muted?: boolean;
}

/** Typed text primitive. Applies the type scale and RTL-aware alignment. */
export function Text({ variant = 'body', color, center, muted, style, ...rest }: Props) {
  const { isRTL } = useLocale();
  const base = type[variant] as TextStyle;
  const resolved: TextStyle = {
    ...base,
    color: color ?? (muted ? palette.mutedText : palette.ink),
    textAlign: center ? 'center' : isRTL ? 'right' : 'left',
    writingDirection: isRTL ? 'rtl' : 'ltr',
  };
  return <RNText {...rest} style={[resolved, style]} />;
}
