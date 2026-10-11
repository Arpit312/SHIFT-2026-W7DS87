import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bot, Building2, Cpu, Map, MessageCircle, ShieldCheck } from 'lucide-react-native';

import { AppHeader, AppScreen, Card, FeatureRow, Pill } from '../components/charge-ui';
import { ChargeColors as C, ChargeSpacing as S } from '../constants/charge-theme';

export default function ExploreScreen() {
  return (
    <AppScreen>
      <SafeAreaView style={styles.safe}>
        <AppHeader title="Ecosystem" subtitle="ChargeNOC v3 feature map" showLogo />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Card tone="highlight" style={styles.hero}>
            <Pill label="Active Ecosystem" tone="warn" />
            <Text style={styles.title}>Built for the full home-charging loop</Text>
            <Text style={styles.body}>
              Permission, protection, planning, payment and people: real-time AI vision and dynamic grid scheduling keep owners and RWAs compliant.
            </Text>
          </Card>

          <Card>
            <FeatureRow color={C.blue} icon={Bot} title="Real-time AI Photo Check" subtitle="Multimodal computer vision, fire risk score, IS 732 compliance" />
            <FeatureRow color={C.orange} icon={Cpu} title="Dynamic Load Planner" subtitle="Live transformer load detection, off-peak slot optimization" />
            <FeatureRow color={C.amber} icon={MessageCircle} title="WhatsApp approvals" subtitle="Committee poll links for non-app users" />
            <FeatureRow color={C.green} icon={ShieldCheck} title="Society safety grade" subtitle="Renewal checks, records and yearly review" />
            <FeatureRow color={C.blue} icon={Map} title="DISCOM view" subtitle="Anonymised charging load reports for future pilots" />
            <FeatureRow color={C.orange} icon={Building2} title="Builder-ready kit" subtitle="EV-ready checklist for new societies" />
          </Card>
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
    paddingBottom: 36,
    gap: S.lg,
  },
  hero: {
    gap: S.md,
  },
  title: {
    color: C.text,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '900',
  },
  body: {
    color: C.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
});

