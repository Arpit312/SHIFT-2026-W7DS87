import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell, Languages, LogOut, Shield, Trash2, User } from 'lucide-react-native';

import { AppHeader, AppScreen, AvatarBadge, Card, FeatureRow, Pill, PrimaryButton } from '../../components/charge-ui';
import { ChargeColors as C, ChargeSpacing as S } from '../../constants/charge-theme';
import { supabase } from '../../lib/supabase';

export default function ProfileScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  const showStub = (title: string) => {
    Alert.alert(title, 'Demo mode mein ye setting local preview hai.');
  };

  return (
    <AppScreen>
      <SafeAreaView style={styles.safe}>
        <AppHeader title="Profile" subtitle="Owner settings and privacy" />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Card tone="highlight" style={styles.profileCard}>
            <AvatarBadge source={require('../../../assets/images/logo-glow.png')} />
            <View style={styles.profileText}>
              <Text style={styles.name}>EV Owner</Text>
              <Text style={styles.meta}>Sunrise Apartments · A-101</Text>
              <View style={styles.pillRow}>
                <Pill label="Hindi + English" tone="info" />
                <Pill label="Privacy first" tone="good" />
              </View>
            </View>
          </Card>

          <Card>
            <FeatureRow
              color={C.blue}
              icon={User}
              onPress={() => showStub('Owner profile')}
              title="Owner and vehicle"
              subtitle="EV model, flat, parking and consent details"
            />
            <FeatureRow
              color={C.orange}
              icon={Bell}
              onPress={() => showStub('Reminders')}
              title="Charging reminders"
              subtitle="Morning card, plug-in alert and unplug reminder"
            />
            <FeatureRow
              color={C.green}
              icon={Languages}
              onPress={() => showStub('Language')}
              title="Language"
              subtitle="Hindi first, English always available"
            />
            <FeatureRow
              color={C.amber}
              icon={Shield}
              onPress={() => showStub('Privacy controls')}
              title="Privacy controls"
              subtitle="Download or delete request data"
            />
          </Card>

          <Card>
            <FeatureRow
              color={C.red}
              icon={Trash2}
              title="Data policy"
              subtitle="Aadhaar numbers are never stored; signatures use licensed providers later"
            />
          </Card>

          <PrimaryButton label="Sign out" icon={LogOut} variant="danger" onPress={handleLogout} />
        </ScrollView>
      </SafeAreaView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    padding: S.lg,
    paddingBottom: 96,
    gap: S.lg,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
  },
  profileText: {
    flex: 1,
    gap: S.xs,
  },
  name: {
    color: C.text,
    fontSize: 22,
    fontWeight: '900',
  },
  meta: {
    color: C.textMuted,
    fontSize: 13,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: S.sm,
    marginTop: S.xs,
  },
});

