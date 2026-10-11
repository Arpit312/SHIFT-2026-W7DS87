import React from 'react';
import {
  Image,
  ImageSourcePropType,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { ChargeColors as C, ChargeRadius as R, ChargeSpacing as S } from '../constants/charge-theme';

type IconComponent = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

export function BrandLogo({ size = 72 }: { size?: number }) {
  return (
    <Image
      source={require('../../assets/images/logo-themed.jpg')}
      resizeMode="contain"
      style={{ width: size * 2.05, height: size }}
    />
  );
}

export function AppScreen({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

export function AppHeader({
  title,
  subtitle,
  right,
  showLogo,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  showLogo?: boolean;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {showLogo && <BrandLogo size={30} />}
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {right}
    </View>
  );
}

export function Card({
  children,
  style,
  tone = 'default',
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: 'default' | 'highlight';
}) {
  return <View style={[styles.card, tone === 'highlight' && styles.highlightCard, style]}>{children}</View>;
}

export function Pill({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'good' | 'warn' | 'info' | 'danger';
}) {
  const toneStyle = {
    neutral: styles.pillNeutral,
    good: styles.pillGood,
    warn: styles.pillWarn,
    info: styles.pillInfo,
    danger: styles.pillDanger,
  }[tone];
  return (
    <View style={[styles.pill, toneStyle]}>
      <Text style={[styles.pillText, tone === 'danger' && { color: C.red }]}>{label}</Text>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  icon: Icon,
  disabled,
  variant = 'primary',
}: {
  label: string;
  onPress?: () => void;
  icon?: IconComponent;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}) {
  const variantStyle = {
    primary: styles.primaryButton,
    secondary: styles.secondaryButton,
    danger: styles.dangerButton,
  }[variant];
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, variantStyle, disabled && styles.disabledButton]}>
      {Icon ? <Icon size={18} color={variant === 'secondary' ? C.text : C.white} strokeWidth={2.4} /> : null}
      <Text style={[styles.buttonText, variant === 'secondary' && styles.secondaryButtonText]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function FeatureRow({
  title,
  subtitle,
  icon: Icon,
  color = C.orange,
  onPress,
  trailing,
}: {
  title: string;
  subtitle: string;
  icon: IconComponent;
  color?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
}) {
  const content = (
    <>
      <View style={[styles.iconBox, { backgroundColor: `${color}1A` }]}>
        <Icon size={20} color={color} strokeWidth={2.4} />
      </View>
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureSubtitle}>{subtitle}</Text>
      </View>
      {trailing ?? (onPress ? <ChevronRight size={18} color={C.textMuted} /> : null)}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.82} onPress={onPress} style={styles.featureRow}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.featureRow}>{content}</View>;
}

export function Metric({
  label,
  value,
  color = C.text,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

export function AvatarBadge({ source }: { source?: ImageSourcePropType }) {
  return (
    <View style={styles.avatarBadge}>
      {source ? <Image source={source} resizeMode="cover" style={StyleSheet.absoluteFill} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.background,
  },
  header: {
    paddingHorizontal: S.lg,
    paddingTop: S.md,
    paddingBottom: S.lg,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: S.md,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
  },
  headerTitle: {
    color: C.text,
    fontSize: 20,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: C.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  card: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.md,
    padding: S.lg,
  },
  highlightCard: {
    backgroundColor: '#17120E',
    borderColor: '#6A3A18',
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: R.sm,
    borderWidth: 1,
    paddingHorizontal: S.sm,
    paddingVertical: S.xs,
  },
  pillNeutral: {
    borderColor: C.border,
    backgroundColor: C.panel,
  },
  pillGood: {
    borderColor: '#255E3F',
    backgroundColor: '#10291C',
  },
  pillWarn: {
    borderColor: '#71542A',
    backgroundColor: '#2A2113',
  },
  pillInfo: {
    borderColor: '#255678',
    backgroundColor: '#102536',
  },
  pillDanger: {
    borderColor: '#6C2227',
    backgroundColor: '#261214',
  },
  pillText: {
    color: C.text,
    fontSize: 11,
    fontWeight: '700',
  },
  button: {
    minHeight: 48,
    borderRadius: R.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: S.sm,
    paddingHorizontal: S.lg,
  },
  primaryButton: {
    backgroundColor: C.orange,
  },
  secondaryButton: {
    backgroundColor: C.surfaceAlt,
    borderWidth: 1,
    borderColor: C.border,
  },
  dangerButton: {
    backgroundColor: '#35191B',
    borderWidth: 1,
    borderColor: '#653035',
  },
  disabledButton: {
    opacity: 0.55,
  },
  buttonText: {
    color: C.white,
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButtonText: {
    color: C.text,
  },
  featureRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    paddingVertical: S.md,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: R.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    color: C.text,
    fontSize: 15,
    fontWeight: '800',
  },
  featureSubtitle: {
    color: C.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  metric: {
    flex: 1,
    minHeight: 72,
    justifyContent: 'center',
    backgroundColor: C.surfaceAlt,
    borderRadius: R.md,
    padding: S.md,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  metricLabel: {
    color: C.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  avatarBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.panel,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
  },
});

