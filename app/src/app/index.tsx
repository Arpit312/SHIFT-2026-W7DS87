import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BatteryCharging, CheckCircle2, ChevronRight, ShieldCheck, WalletCards } from 'lucide-react-native';

import { AppScreen, BrandLogo, Card, FeatureRow, Pill, PrimaryButton } from '../components/charge-ui';
import { ChargeColors as C, ChargeSpacing as S } from '../constants/charge-theme';
import { getLatestScanResult } from '../lib/ai-vision-service';

const promises = [
  { title: 'Permission', subtitle: 'NOC request packet in minutes', icon: CheckCircle2, color: C.green },
  { title: 'Protection', subtitle: 'AI photo check with human sign-off', icon: ShieldCheck, color: C.blue },
  { title: 'Planning', subtitle: 'Fair night slots and plug-in reminders', icon: BatteryCharging, color: C.orange },
  { title: 'Payment', subtitle: 'Virtual bill and savings tracker', icon: WalletCards, color: C.amber },
];

export default function StartScreen() {
  const router = useRouter();
  const [showSplash, setShowSplash] = React.useState(true);
  const [aiScore, setAiScore] = React.useState<number>(84);

  React.useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1200);
    (async () => {
      const scan = await getLatestScanResult();
      if (scan) setAiScore(scan.fireRiskScore);
    })();
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return (
      <AppScreen style={styles.splash}>
        <Image source={require('../../assets/images/logo-glow.png')} resizeMode="contain" style={styles.glow} />
        <BrandLogo size={86} />
        <Text style={styles.splashText}>Home EV charging, approved safely.</Text>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.topBar}>
            <BrandLogo size={42} />
            <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/login')} style={styles.signInChip}>
              <Text style={styles.signInText}>Sign in</Text>
            </TouchableOpacity>
          </View>

          <Card tone="highlight" style={styles.heroCard}>
            <Pill label="ChargeNOC v3" tone="warn" />
            <Text style={styles.title}>Your society charging companion</Text>
            <Text style={styles.subtitle}>
              Get approval, check socket safety, schedule charging, track bills, and keep the RWA record clean.
            </Text>
            <View style={styles.heroImageWrap}>
              <Image source={require('../../assets/images/hero-3d.jpg')} resizeMode="cover" style={styles.heroImage} />
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreValue}>{aiScore}</Text>
                <Text style={styles.scoreLabel}>Fire score</Text>
              </View>
            </View>
            <PrimaryButton label="Start app setup" icon={ChevronRight} onPress={() => router.push('/signup')} />
          </Card>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily app flow</Text>
            <Text style={styles.sectionMeta}>3 taps or less</Text>
          </View>

          <Card>
            {promises.map((item) => (
              <FeatureRow key={item.title} {...item} />
            ))}
          </Card>

          <View style={styles.footerActions}>
            <PrimaryButton label="RWA admin login" variant="secondary" onPress={() => router.push('/login')} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  splash: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: S.xxl,
  },
  glow: {
    position: 'absolute',
    width: 280,
    height: 280,
    opacity: 0.55,
  },
  splashText: {
    color: C.textMuted,
    fontSize: 14,
    marginTop: S.lg,
    textAlign: 'center',
  },
  content: {
    padding: S.lg,
    paddingBottom: 36,
    gap: S.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  signInChip: {
    minHeight: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    justifyContent: 'center',
    paddingHorizontal: S.md,
    backgroundColor: C.surface,
  },
  signInText: {
    color: C.text,
    fontWeight: '800',
  },
  heroCard: {
    gap: S.lg,
  },
  title: {
    color: C.text,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900',
  },
  subtitle: {
    color: C.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  heroImageWrap: {
    height: 210,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: C.panel,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  scoreBadge: {
    position: 'absolute',
    right: S.md,
    bottom: S.md,
    width: 88,
    borderRadius: 8,
    backgroundColor: 'rgba(9,10,12,0.86)',
    borderWidth: 1,
    borderColor: '#6A3A18',
    padding: S.sm,
  },
  scoreValue: {
    color: C.orange,
    fontSize: 24,
    fontWeight: '900',
  },
  scoreLabel: {
    color: C.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: S.xs,
  },
  sectionTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: '900',
  },
  sectionMeta: {
    color: C.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  footerActions: {
    gap: S.md,
  },
});

