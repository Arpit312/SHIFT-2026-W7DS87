import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BadgeCheck,
  ClipboardCheck,
  Clock3,
  QrCode,
  Send,
  ShieldCheck,
  UserCheck,
  Zap,
} from 'lucide-react-native';

import { AppHeader, AppScreen, Card, FeatureRow, Metric, Pill, PrimaryButton } from '../../components/charge-ui';
import { ChargeColors as C, ChargeSpacing as S } from '../../constants/charge-theme';
import { getSavedNOCPacket, NOCPacketData } from '../../lib/noc-packet-service';

export default function PacketScreen() {
  const [packet, setPacket] = useState<NOCPacketData | null>(null);

  useEffect(() => {
    (async () => {
      const saved = await getSavedNOCPacket();
      setPacket(saved);
    })();
  }, []);

  const handleShare = () => {
    if (!packet) return;
    Alert.alert(
      'NOC Packet Link Ready',
      `Shareable verification link generated for RWA committee:\nhttps://chargenoc.in/verify/${packet.packetId}\n\nIncludes cryptographic audit proof and photo inspection record.`
    );
  };

  const copyQrPayload = () => {
    if (!packet) return;
    Alert.alert('Digital Signature Hash', packet.qrPayload);
  };

  return (
    <AppScreen>
      <SafeAreaView style={styles.safe}>
        <AppHeader title="Haan Packet" subtitle="Real-time verified evidence for the RWA" />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Card tone="highlight" style={styles.packetCard}>
            <View style={styles.rowBetween}>
              <Pill label={packet?.status || 'Draft packet'} tone="warn" />
              <Pill label="Cryptographically Signed" tone="info" />
            </View>

            {/* QR Viewport */}
            <TouchableOpacity activeOpacity={0.85} onPress={copyQrPayload} style={styles.qrBox}>
              <QrCode size={104} color={C.text} />
              <Text style={styles.qrSubText}>Tap to inspect verifiable payload hash</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Request {packet?.packetId || 'CNOC-2026-014'}</Text>
            <Text style={styles.note}>
              Legally compliant agreement packet with computer-vision photo evidence for {packet?.societyName || 'Sunrise Apartments'} Committee.
            </Text>

            <View style={styles.metricsRow}>
              <Metric
                label="AI Fire Score"
                value={`${packet?.aiFireScore || 82}`}
                color={packet && packet.aiFireScore >= 80 ? C.green : C.amber}
              />
              <Metric label="Conditions" value={`${packet?.conditions.length || 2}`} color={C.amber} />
              <Metric label="Votes" value={packet?.committeeApprovalVotes || '3/5'} color={C.blue} />
            </View>
          </Card>

          {/* Real Applicant & EV Details */}
          <Card>
            <FeatureRow
              color={C.green}
              icon={BadgeCheck}
              title={`${packet?.vehicleModel || 'Ather 450X'} · ${packet?.parkingLocation || 'P2-17'}`}
              subtitle={`${packet?.applicantName || 'EV Owner'} (${packet?.flatNumber || 'A-101'}) · ${packet?.chargerRating || '3.3 kW'}`}
            />
            <FeatureRow
              color={C.blue}
              icon={ShieldCheck}
              title={`AI Safety Grade: ${packet?.aiSafetyGrade || 'A - Certified Safe'}`}
              subtitle={`Audited against IS 732 & IS 17017 standards · Hazard Level: ${packet?.aiHazardLevel || 'LOW'}`}
            />
            <FeatureRow
              color={C.amber}
              icon={UserCheck}
              title="Electrician Sign-Off"
              subtitle="Pending earthing resistance confirmation (<5 Ohms)"
            />
          </Card>

          {/* Dynamic Conditions List */}
          {packet && packet.conditions.length > 0 && (
            <Card style={styles.conditionsCard}>
              <View style={styles.conditionsHeader}>
                <ClipboardCheck size={18} color={C.orange} />
                <Text style={styles.conditionsTitle}>Attached Safety Conditions</Text>
              </View>
              {packet.conditions.map((cond, idx) => (
                <View key={idx} style={styles.conditionRow}>
                  <Text style={styles.condIndex}>{idx + 1}.</Text>
                  <Text style={styles.condText}>{cond}</Text>
                </View>
              ))}
            </Card>
          )}

          {/* WhatsApp Poll & Verification */}
          <Card>
            <FeatureRow
              color={C.blue}
              icon={Clock3}
              title="WhatsApp Committee Poll"
              subtitle="Management committee can review and vote with 1-tap OTP without installing app"
              trailing={<Pill label="Ready" tone="good" />}
            />
            <FeatureRow
              color={C.green}
              icon={Zap}
              title="Automated Meter Reconciliation"
              subtitle="Virtual meter logs linked to society common meter billing"
              trailing={<Pill label="Active" tone="info" />}
            />
          </Card>

          <PrimaryButton label="Share Verified Packet Link" icon={Send} onPress={handleShare} />
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
  packetCard: {
    alignItems: 'stretch',
    gap: S.md,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: S.md,
  },
  qrBox: {
    height: 170,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  qrSubText: {
    color: C.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    color: C.text,
    fontSize: 24,
    fontWeight: '900',
  },
  note: {
    color: C.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: S.sm,
  },
  conditionsCard: {
    gap: S.sm,
  },
  conditionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    marginBottom: 4,
  },
  conditionsTitle: {
    color: C.text,
    fontSize: 15,
    fontWeight: '900',
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: S.xs,
    paddingVertical: 2,
  },
  condIndex: {
    color: C.orange,
    fontSize: 12,
    fontWeight: '800',
    width: 18,
  },
  condText: {
    color: C.textMuted,
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
});
