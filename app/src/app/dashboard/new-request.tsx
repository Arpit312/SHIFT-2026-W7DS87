import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bot, Building2, Car, CheckCircle2, FileCheck2, PlugZap, Send, ShieldCheck } from 'lucide-react-native';

import { AppHeader, AppScreen, Card, FeatureRow, Pill, PrimaryButton } from '../../components/charge-ui';
import { ChargeColors as C, ChargeSpacing as S } from '../../constants/charge-theme';
import { createOrUpdateNOCPacket } from '../../lib/noc-packet-service';
import { AIVisionResult, getLatestScanResult } from '../../lib/ai-vision-service';
import { EV_DATABASE, getSavedVehicleId, saveSelectedVehicleId } from '../../lib/load-planner-service';

const checklist = [
  'Allotted parking bay confirmed in society records',
  'No extension board or multi-plug daisy chain',
  'Licensed electrician earthing resistance verified (<5 Ohms)',
  'Monthly virtual bill reconciliation accepted',
];

export default function NewRequestScreen() {
  const router = useRouter();

  const [vehicle, setVehicle] = useState('Ather 450X');
  const [charger, setCharger] = useState('3.3 kW portable charger');
  const [parking, setParking] = useState('P2-17 near meter room');
  const [accepted, setAccepted] = useState(true);
  const [latestAiScan, setLatestAiScan] = useState<AIVisionResult | null>(null);

  useEffect(() => {
    (async () => {
      const vid = await getSavedVehicleId();
      const v = EV_DATABASE.find(item => item.id === vid);
      if (v) {
        setVehicle(v.name);
        setCharger(`${v.maxAcKw} kW portable charger`);
      }
      const ai = await getLatestScanResult();
      if (ai) setLatestAiScan(ai);
    })();
  }, []);

  const goTo = (path: '/dashboard/ai-check' | '/dashboard/packet') => {
    router.push(path as never);
  };

  const submitRequest = async () => {
    if (!vehicle.trim() || !charger.trim() || !parking.trim()) {
      Alert.alert('Missing details', 'Vehicle, charger aur parking detail fill karo.');
      return;
    }
    if (!accepted) {
      Alert.alert('Checklist needed', 'Safety checklist accept karna required hai.');
      return;
    }

    // Save actual vehicle mapping
    const matchedV = EV_DATABASE.find(v => v.name.toLowerCase().includes(vehicle.toLowerCase().trim()));
    if (matchedV) {
      await saveSelectedVehicleId(matchedV.id);
    }

    await createOrUpdateNOCPacket({
      vehicleModel: vehicle.trim(),
      chargerRating: charger.trim(),
      parkingLocation: parking.trim(),
      checklistAccepted: accepted,
    });

    Alert.alert(
      'NOC Packet Generated!',
      latestAiScan
        ? `Packet created with verified AI Score (${latestAiScan.fireRiskScore}/100) and ${latestAiScan.requiredConditions.length} safety conditions.`
        : 'Packet created. AI Photo Check attach karne se approval probability 95% ho jati hai.'
    );
    goTo('/dashboard/packet');
  };

  return (
    <AppScreen>
      <SafeAreaView style={styles.safe}>
        <AppHeader title="New request" subtitle="Build a verified RWA approval packet" />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Card tone="highlight" style={styles.card}>
            <View style={styles.rowBetween}>
              <Pill label="NOC request" tone="warn" />
              <Pill label={latestAiScan ? 'AI Evidence Attached' : 'Photo Pending'} tone={latestAiScan ? 'good' : 'neutral'} />
            </View>

            <Field
              icon={Car}
              label="EV model"
              onChangeText={setVehicle}
              placeholder="e.g. Ather 450X or Tata Nexon EV"
              value={vehicle}
            />
            <Field
              icon={PlugZap}
              label="Charger rating"
              onChangeText={setCharger}
              placeholder="e.g. 3.3 kW portable charger"
              value={charger}
            />
            <Field
              icon={Building2}
              label="Parking / socket location"
              onChangeText={setParking}
              placeholder="Tower, basement, bay number"
              value={parking}
            />
          </Card>

          <Card>
            <FeatureRow
              color={latestAiScan ? C.green : C.blue}
              icon={latestAiScan ? ShieldCheck : Bot}
              onPress={() => goTo('/dashboard/ai-check')}
              title={latestAiScan ? 'AI Photo Check Verified' : 'Attach AI photo check'}
              subtitle={
                latestAiScan
                  ? `Fire Risk Score: ${latestAiScan.fireRiskScore}/100 (${latestAiScan.safetyGrade.split(' - ')[0]})`
                  : 'Run real computer vision audit before submitting to RWA'
              }
              trailing={
                <Pill
                  label={latestAiScan ? `${latestAiScan.fireRiskScore} Safe` : 'Run Scan'}
                  tone={latestAiScan ? 'good' : 'warn'}
                />
              }
            />
            <FeatureRow
              color={C.green}
              icon={FileCheck2}
              onPress={() => goTo('/dashboard/packet')}
              title="Preview Haan Packet"
              subtitle="View dynamic QR record, conditions and committee voting"
            />
          </Card>

          <Card style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionTitle}>Safety checklist</Text>
              <TouchableOpacity activeOpacity={0.8} onPress={() => setAccepted((value) => !value)} style={styles.checkToggle}>
                <CheckCircle2 size={18} color={accepted ? C.green : C.textMuted} />
                <Text style={[styles.checkToggleText, accepted && { color: C.green }]}>
                  {accepted ? 'Accepted' : 'Review'}
                </Text>
              </TouchableOpacity>
            </View>
            {checklist.map((item) => (
              <View key={item} style={styles.checkItem}>
                <CheckCircle2 size={16} color={accepted ? C.green : C.textMuted} />
                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </Card>

          <PrimaryButton label="Submit packet draft" icon={Send} onPress={submitRequest} />
        </ScrollView>
      </SafeAreaView>
    </AppScreen>
  );
}

function Field({
  icon: Icon,
  label,
  value,
  placeholder,
  onChangeText,
}: {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Icon size={16} color={C.orange} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <TextInput
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.textMuted}
        style={styles.input}
        value={value}
      />
    </View>
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
  card: {
    gap: S.md,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: S.md,
  },
  field: {
    gap: S.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
  },
  label: {
    color: C.text,
    fontSize: 13,
    fontWeight: '900',
  },
  input: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.background,
    color: C.text,
    paddingHorizontal: S.md,
    fontSize: 15,
  },
  sectionTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: '900',
  },
  checkToggle: {
    minHeight: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surfaceAlt,
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.xs,
    paddingHorizontal: S.sm,
  },
  checkToggleText: {
    color: C.textMuted,
    fontSize: 12,
    fontWeight: '900',
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
  },
  checkText: {
    color: C.textMuted,
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
