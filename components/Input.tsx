import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { palette, radius, spacing, type } from '@/theme/tokens';
import { useLocale } from '@/hooks/useLocale';
import { useKeyboardScroll } from './KeyboardScroll';

interface Props extends TextInputProps {
  label?: string;
  error?: string | null;
  hint?: string;
  secure?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Ref to the underlying TextInput (e.g. to focus the next field). */
  inputRef?: React.Ref<TextInput>;
}

export function Input({ label, error, hint, secure, icon, style, inputRef, ...rest }: Props) {
  const { isRTL, t } = useLocale();
  const [hidden, setHidden] = useState(!!secure);
  const [focused, setFocused] = useState(false);
  const kbScroll = useKeyboardScroll();

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text variant="meta" muted style={styles.label}>
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.field,
          { flexDirection: isRTL ? 'row-reverse' : 'row' },
          focused && styles.focused,
          error ? styles.errored : null,
        ]}
      >
        {icon ? <Ionicons name={icon} size={18} color={palette.mutedText} style={{ marginHorizontal: 6 }} /> : null}
        <TextInput
          ref={inputRef}
          {...rest}
          secureTextEntry={hidden}
          placeholderTextColor={palette.mutedText}
          onFocus={(e) => {
            setFocused(true);
            kbScroll?.ensureVisible();
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          style={[
            styles.input,
            { textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' },
            style,
          ]}
        />
        {secure ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={hidden ? t('auth.showPassword') : t('auth.hidePassword')}
            style={{ paddingHorizontal: 6 }}
          >
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={palette.mutedText} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text variant="meta" color={palette.errorRed} style={styles.msg}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="meta" muted style={styles.msg}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  label: { marginBottom: spacing.xs },
  field: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: radius.input,
    borderWidth: 1.5,
    borderColor: 'rgba(37,53,47,0.08)',
    paddingHorizontal: spacing.md,
    minHeight: 54,
  },
  // Colour-only focus state: no shadow/elevation, which flickers on Android.
  focused: { borderColor: palette.forest, backgroundColor: palette.white },
  errored: { borderColor: palette.errorRed },
  input: { flex: 1, fontSize: type.body.fontSize, color: palette.ink, paddingVertical: 12 },
  msg: { marginTop: spacing.xs },
});
