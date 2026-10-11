import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Zap, ChevronRight, ShieldAlert, BarChart3, CheckCircle2, FileText, Lock } from 'lucide-react-native';
import HeroScene from '../components/HeroScene';

const C = {
  background: '#0A0A0B',
  surface: '#111113',
  elevated: '#18181B',
  border: '#2A2A2F',
  textPrimary: '#F4F1EA',
  textMuted: '#A3A3AD',
  brandOrange: '#FF7A1A',
  gold: '#D9A93C',
  danger: '#EF4444',
  info: '#38BDF8',
  success: '#22C55E',
};

export default function LandingPage() {
  const router = useRouter();
  const splashOpacity = useSharedValue(1);
  const [splashVisible, setSplashVisible] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      splashOpacity.value = withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) }, (finished) => {
        if (finished) {
          runOnJS(setSplashVisible)(false);
        }
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const splashStyle = useAnimatedStyle(() => {
    return {
      opacity: splashOpacity.value,
      zIndex: splashOpacity.value > 0 ? 999 : -1,
      pointerEvents: splashOpacity.value > 0 ? 'auto' : 'none',
    };
  });

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      {/* Main App Content */}
      <SafeAreaView style={s.safe}>
      <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={s.header}>
          <Image
            source={require('../../assets/images/logo-themed.jpg')}
            style={{ height: 80, width: 150 }}
            resizeMode="contain"
          />
          <View style={s.headerRight}>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={s.signInText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/signup')} style={s.getStartedBtn}>
              <Text style={s.getStartedText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero */}
        <View style={s.heroContainer}>

          <View style={s.heroContent}>
            <View style={s.badge}>
              <Zap size={16} color={C.brandOrange} />
              <Text style={s.badgeText}>For Indian Apartment Societies</Text>
            </View>

            <Text style={s.heroTitle}>
              Give Your RWA a Reason{'\n'}
              <Text style={{ color: C.brandOrange }}>to Say Yes.</Text>
            </Text>

            <Text style={s.heroDesc}>
              ChargeNOC helps residents request EV charging permission, and helps
              Resident Welfare Associations (RWAs) make safe, evidence-based
              decisions without installing new hardware.
            </Text>

            <TouchableOpacity onPress={() => router.push('/signup')} style={s.primaryBtn}>
              <Text style={s.primaryBtnText}>Start Charging Request</Text>
              <ChevronRight size={20} color="white" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/login')} style={s.secondaryBtn}>
              <Text style={s.secondaryBtnText}>RWA Admin Login</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Concerns */}
        <View style={s.concerns}>
          <Text style={s.sectionTitle}>Addressing Core RWA Concerns</Text>
          <Text style={s.sectionDesc}>
            We provide the documented evidence RWAs need to confidently approve
            EV charging installations.
          </Text>

          <View style={s.card}>
            <View style={[s.iconWrap, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
              <ShieldAlert size={24} color={C.danger} />
            </View>
            <Text style={s.cardTitle}>Fire & Wiring Safety</Text>
            <Text style={s.cardDesc}>
              ChargeNOC's AI screening and required photo evidence ensure
              installations meet basic safety standards before an electrician is
              even dispatched.
            </Text>
          </View>

          <View style={[s.card, { marginTop: 16 }]}>
            <View style={[s.iconWrap, { backgroundColor: 'rgba(56,189,248,0.1)' }]}>
              <BarChart3 size={24} color={C.info} />
            </View>
            <Text style={s.cardTitle}>Electrical Load</Text>
            <Text style={s.cardDesc}>
              By capturing charger specifications upfront, the RWA can track
              cumulative society load and safely schedule charging times.
            </Text>
          </View>

          <View style={[s.card, { marginTop: 16 }]}>
            <View style={[s.iconWrap, { backgroundColor: 'rgba(34,197,94,0.1)' }]}>
              <Zap size={24} color={C.success} />
            </View>
            <Text style={s.cardTitle}>Electricity Billing</Text>
            <Text style={s.cardDesc}>
              Provides a transparent reconciliation framework for sub-meters, ensuring society electricity is fairly billed to the EV owner.
            </Text>
          </View>
        </View>

        {/* How it works */}
        <View style={s.howItWorks}>
          <Text style={s.sectionTitle}>How ChargeNOC Works</Text>

          <View style={s.step}>
            <CheckCircle2 size={24} color={C.brandOrange} style={s.stepIcon} />
            <View style={s.stepContent}>
              <Text style={s.stepTitle}>1. EV Owner Requests</Text>
              <Text style={s.stepDesc}>Owner submits vehicle details, socket ratings, and photos of the installation area.</Text>
            </View>
          </View>

          <View style={s.step}>
            <CheckCircle2 size={24} color={C.brandOrange} style={s.stepIcon} />
            <View style={s.stepContent}>
              <Text style={s.stepTitle}>2. AI Preliminary Screening</Text>
              <Text style={s.stepDesc}>Our vision model analyzes photos for hazards, clear labels, and proper earthing indicators.</Text>
            </View>
          </View>

          <View style={s.step}>
            <CheckCircle2 size={24} color={C.brandOrange} style={s.stepIcon} />
            <View style={s.stepContent}>
              <Text style={s.stepTitle}>3. Professional Verification</Text>
              <Text style={s.stepDesc}>If required, an assigned electrician verifies the setup and uploads a sign-off report.</Text>
            </View>
          </View>

          <View style={s.step}>
            <CheckCircle2 size={24} color={C.brandOrange} style={s.stepIcon} />
            <View style={s.stepContent}>
              <Text style={s.stepTitle}>4. RWA Decision</Text>
              <Text style={s.stepDesc}>RWA reviews the complete, documented packet and records an official decision.</Text>
            </View>
          </View>

          <View style={s.mockupContainer}>
            <View style={s.mockupCard}>
              <View style={s.mockupHeader}>
                <Text style={s.mockupTitle}>Haan Packet</Text>
                <View style={s.mockupBadge}>
                  <Text style={s.mockupBadgeText}>Generated</Text>
                </View>
              </View>
              <View style={[s.mockupLine, { width: '75%' }]} />
              <View style={[s.mockupLine, { width: '50%' }]} />
              <View style={[s.mockupLine, { width: '83%' }]} />
              <View style={s.mockupBox}>
                <FileText size={32} color={C.textMuted} />
              </View>
            </View>
          </View>
        </View>

        {/* Trust Section */}
        <View style={s.trustSection}>
          <Lock size={40} color={C.textMuted} style={{ marginBottom: 24, alignSelf: 'center' }} />
          <Text style={s.trustTitle}>Our Commitment to Transparency</Text>
          <Text style={s.trustText}>
            ChargeNOC provides <Text style={{ color: C.textPrimary, fontWeight: 'bold' }}>preliminary screening</Text>, not electrical certification.
          </Text>
          <Text style={s.trustText}>
            The generated "Haan Packet" records a request and an RWA decision. It is <Text style={{ color: C.textPrimary, fontWeight: 'bold' }}>not a legal NOC</Text> or a safety certificate.
          </Text>
          <Text style={s.trustText}>
            We do not physically control chargers or electrical supply. We provide the workflow and documentation required for safe human decision-making.
          </Text>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Text style={{ color: C.textMuted, fontWeight: 'bold', fontSize: 18 }}>ChargeNOC</Text>
          </View>
          <Text style={{ color: C.textMuted }}>© 2026 ChargeNOC. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>

      {/* Smooth Fading Splash Screen Overlay */}
      {splashVisible && (
        <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: C.background, alignItems: 'center', justifyContent: 'center' }, splashStyle]}>
          <HeroScene />
        </Animated.View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  scroll: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border,
    backgroundColor: 'rgba(10, 10, 11, 0.8)'
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  signInText: { color: C.textMuted, fontWeight: '500' },
  getStartedBtn: { backgroundColor: C.brandOrange, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  getStartedText: { color: 'white', fontWeight: '600', fontSize: 14 },

  heroContainer: { position: 'relative', overflow: 'hidden' },
  heroContent: { paddingHorizontal: 16, paddingTop: 48, paddingBottom: 64, alignItems: 'center' },
  badge: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderColor: 'rgba(255,122,26,0.3)', backgroundColor: 'rgba(255,122,26,0.1)',
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, marginBottom: 32,
  },
  badgeText: { color: C.brandOrange, fontSize: 13, fontWeight: '500', marginLeft: 8 },
  heroTitle: {
    color: C.textPrimary, fontSize: 36, fontWeight: '800', textAlign: 'center',
    marginBottom: 20, lineHeight: 44,
  },
  heroDesc: {
    color: C.textMuted, textAlign: 'center', fontSize: 16, lineHeight: 24,
    marginBottom: 32, paddingHorizontal: 8,
  },
  primaryBtn: {
    backgroundColor: C.brandOrange, width: '100%', paddingVertical: 16,
    borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
  primaryBtnText: { color: 'white', fontSize: 18, fontWeight: '700', marginRight: 8 },
  secondaryBtn: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    width: '100%', paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginTop: 12,
  },
  secondaryBtnText: { color: C.textPrimary, fontSize: 18, fontWeight: '700' },

  concerns: { paddingHorizontal: 16, paddingVertical: 40, backgroundColor: C.surface },
  sectionTitle: { color: C.textPrimary, fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  sectionDesc: { color: C.textMuted, textAlign: 'center', marginBottom: 28, paddingHorizontal: 16 },
  card: {
    backgroundColor: C.background, padding: 24, borderRadius: 16,
    borderWidth: 1, borderColor: C.border,
  },
  iconWrap: { width: 48, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  cardTitle: { color: C.textPrimary, fontSize: 20, fontWeight: '700', marginBottom: 8 },
  cardDesc: { color: C.textMuted, lineHeight: 22 },

  howItWorks: { paddingHorizontal: 16, paddingVertical: 40 },
  step: { flexDirection: 'row', marginBottom: 24 },
  stepIcon: { marginRight: 16, marginTop: 4 },
  stepContent: { flex: 1 },
  stepTitle: { color: C.textPrimary, fontSize: 18, fontWeight: '600', marginBottom: 4 },
  stepDesc: { color: C.textMuted, lineHeight: 22 },

  mockupContainer: { marginTop: 32, padding: 16, backgroundColor: 'rgba(255, 122, 26, 0.05)', borderRadius: 24 },
  mockupCard: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 24 },
  mockupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.border, paddingBottom: 16, marginBottom: 16 },
  mockupTitle: { color: C.textPrimary, fontSize: 18, fontWeight: 'bold' },
  mockupBadge: { backgroundColor: 'rgba(255, 122, 26, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  mockupBadgeText: { color: C.brandOrange, fontSize: 12, fontWeight: 'bold' },
  mockupLine: { height: 16, backgroundColor: C.elevated, borderRadius: 4, marginBottom: 12 },
  mockupBox: { height: 128, backgroundColor: C.elevated, borderRadius: 8, marginTop: 24, alignItems: 'center', justifyContent: 'center' },

  trustSection: { paddingHorizontal: 16, paddingVertical: 40, backgroundColor: C.elevated, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border },
  trustTitle: { color: C.textPrimary, fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  trustText: { color: C.textMuted, textAlign: 'center', marginBottom: 16, lineHeight: 22 },

  footer: { paddingHorizontal: 16, paddingVertical: 40, backgroundColor: C.background, alignItems: 'center' },
});
