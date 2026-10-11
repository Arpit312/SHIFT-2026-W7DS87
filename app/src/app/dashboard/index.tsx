import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  BatteryCharging,
  Bot,
  CalendarClock,
  Car,
  FileCheck2,
  FilePlus,
  Gauge,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  WalletCards,
  Zap,
} from 'lucide-react-native';

import { AppHeader, AppScreen, Card, FeatureRow, Metric, Pill, PrimaryButton } from '../../components/charge-ui';
import { ChargeColors as C, ChargeSpacing as S } from '../../constants/charge-theme';
import {
  computeRealtimeChargingPlan,
  EV_DATABASE,
  getSavedVehicleId,
  RealtimeChargingPlan,
  saveSelectedVehicleId,
} from '../../lib/load-planner-service';
import { AIVisionResult, getLatestScanResult } from '../../lib/ai-vision-service';
import { calculateMonthlyBillMetrics } from '../../lib/telemetry-service';

export default function DashboardOverview() {
  const router = useRouter();

  const [activeVehicleId, setActiveVehicleId] = useState<string>('ather-450x');
  const [batteryPct] = useState<number>(38);
  const [priorityMode, setPriorityMode] = useState<'ECONOMY' | 'URGENT'>('ECONOMY');
  const [plan, setPlan] = useState<RealtimeChargingPlan | null>(null);
  const [latestAiScan, setLatestAiScan] = useState<AIVisionResult | null>(null);
  const [monthlySpend, setMonthlySpend] = useState<number>(304);

  const recalculate = useCallback((vId: string, bPct: number, mode: 'ECONOMY' | 'URGENT') => {
    const computed = computeRealtimeChargingPlan({
      vehicleId: vId,
      currentBatteryPct: bPct,
      targetBatteryPct: 90,
      priorityMode: mode,
    });
    setPlan(computed);
  }, []);

  // Load and refresh state
  useEffect(() => {
    (async () => {
      const vid = await getSavedVehicleId();
      setActiveVehicleId(vid);

      const ai = await getLatestScanResult();
      if (ai) setLatestAiScan(ai);

      const bill = await calculateMonthlyBillMetrics();
      if (bill) setMonthlySpend(bill.totalBillRupees);

      recalculate(vid, batteryPct, priorityMode);
    })();
  }, [batteryPct, priorityMode, recalculate]);

  const handleVehicleChange = async (vId: string) => {
    setActiveVehicleId(vId);
    await saveSelectedVehicleId(vId);
    recalculate(vId, batteryPct, priorityMode);
  };

  const togglePriorityMode = () => {
    const nextMode = priorityMode === 'ECONOMY' ? 'URGENT' : 'ECONOMY';
    setPriorityMode(nextMode);
    recalculate(activeVehicleId, batteryPct, nextMode);
  };

  const goTo = (path: '/dashboard/ai-check' | '/dashboard/billing' | '/dashboard/new-request' | '/dashboard/packet') => {
    router.push(path as never);
  };

  const vehicle = EV_DATABASE.find(v => v.id === activeVehicleId) || EV_DATABASE[0];
  const estimatedRangeKm = Math.round(((batteryPct / 100) * vehicle.batteryKwh) * vehicle.kmPerKwh);

  return (
    <AppScreen>
      <SafeAreaView style={styles.safe}>
        <AppHeader title="Good morning" subtitle="Sunrise Apartments, A-101" showLogo />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Quick Vehicle Switcher Strip */}
          <View style={styles.vehicleStrip}>
            <Text style={styles.vehicleStripLabel}>Active EV:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vehicleScroll}>
              {EV_DATABASE.slice(0, 5).map((v) => (
                <TouchableOpacity
                  key={v.id}
                  activeOpacity={0.8}
                  onPress={() => handleVehicleChange(v.id)}
                  style={[styles.vehicleChip, activeVehicleId === v.id && styles.vehicleChipActive]}>
                  <Car size={13} color={activeVehicleId === v.id ? C.orange : C.textMuted} />
                  <Text style={[styles.vehicleChipText, activeVehicleId === v.id && styles.vehicleChipTextActive]}>
                    {v.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Real-time AI Load Planner Card */}
          <Card tone="highlight" style={styles.morningCard}>
            <View style={styles.rowBetween}>
              <Pill label={plan?.aiDecisionBadge || 'Smart Schedule'} tone={plan?.canChargeNow ? 'good' : 'warn'} />
              <TouchableOpacity activeOpacity={0.8} onPress={togglePriorityMode} style={styles.modeToggle}>
                <Zap size={13} color={priorityMode === 'URGENT' ? C.orange : C.textMuted} />
                <Text style={[styles.modeToggleText, priorityMode === 'URGENT' && { color: C.orange }]}>
                  {priorityMode === 'URGENT' ? 'Urgent Mode' : 'Smart Mode'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.bigTitle}>
              {plan?.canChargeNow ? 'Ready: Plug in now' : `Plug in at ${plan?.recommendedStartTime || '11:30 PM'}`}
            </Text>

            <Text style={styles.bodyText}>
              {plan?.aiDecisionRationale || 'Calculating optimal society slot...'}
            </Text>

            <View style={styles.metricsRow}>
              <Metric label="Battery" value={`${batteryPct}%`} color={C.green} />
              <Metric label="Range" value={`${estimatedRangeKm} km`} color={C.blue} />
              <Metric
                label="Grid Load"
                value={`${plan?.currentGridLoadPct || 82}%`}
                color={plan?.gridStatus === 'PEAK_CRITICAL' ? C.amber : C.green}
              />
            </View>

            <View style={styles.planFooterRow}>
              <View style={styles.planFooterCol}>
                <Text style={styles.planFooterLabel}>Slot Duration</Text>
                <Text style={styles.planFooterVal}>{plan?.durationFormatted || '3h 15m'}</Text>
              </View>
              <View style={styles.planFooterCol}>
                <Text style={styles.planFooterLabel}>Expected Bill</Text>
                <Text style={styles.planFooterVal}>₹{plan?.estimatedCost || 78}</Text>
              </View>
              {plan && plan.netSavingsRupees > 0 && (
                <View style={styles.planFooterCol}>
                  <Text style={styles.planFooterLabel}>Peak Savings</Text>
                  <Text style={[styles.planFooterVal, { color: C.green }]}>+₹{plan.netSavingsRupees}</Text>
                </View>
              )}
            </View>
          </Card>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <PrimaryButton label="New request" icon={FilePlus} onPress={() => goTo('/dashboard/new-request')} />
            <PrimaryButton label="Run AI check" icon={Bot} variant="secondary" onPress={() => goTo('/dashboard/ai-check')} />
          </View>

          {/* Real-time Feature Navigation */}
          <Card>
            <FeatureRow
              color={latestAiScan && latestAiScan.fireRiskScore < 70 ? C.amber : C.green}
              icon={latestAiScan && latestAiScan.fireRiskScore < 70 ? ShieldAlert : ShieldCheck}
              onPress={() => goTo('/dashboard/ai-check')}
              title="AI safety check"
              subtitle={
                latestAiScan
                  ? `Photo verified: ${latestAiScan.fireRiskScore}/100 fire score (${latestAiScan.safetyGrade.split(' - ')[0]})`
                  : 'Socket photo, fire score, reasons and confidence'
              }
              trailing={
                <Pill
                  label={latestAiScan ? `${latestAiScan.fireRiskScore} safe` : 'Audit photo'}
                  tone={latestAiScan && latestAiScan.fireRiskScore >= 80 ? 'good' : 'warn'}
                />
              }
            />
            <FeatureRow
              color={C.orange}
              icon={CalendarClock}
              title="Smart load planner"
              subtitle={`Fair night queue for ${vehicle.name} without transformer overload`}
              trailing={<Pill label={plan?.recommendedStartTime || '11:30 PM'} tone="warn" />}
            />
            <FeatureRow
              color={C.amber}
              icon={WalletCards}
              onPress={() => goTo('/dashboard/billing')}
              title="Virtual billing"
              subtitle="Reconciled to society meter with live session tracker"
              trailing={<Pill label={`₹${monthlySpend}`} tone="neutral" />}
            />
            <FeatureRow
              color={C.blue}
              icon={FileCheck2}
              onPress={() => goTo('/dashboard/packet')}
              title="Haan Packet"
              subtitle="Live request summary, conditions, poll and QR record"
            />
          </Card>

          {/* Live Request Stage Tracker */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Request tracker</Text>
            <Text style={styles.sectionMeta}>
              {latestAiScan ? 'Stage 3 of 5 (AI Passed)' : 'Stage 2 of 5 (Photo Pending)'}
            </Text>
          </View>

          <Card>
            <View style={styles.timelineItem}>
              <Gauge size={18} color={latestAiScan ? C.green : C.amber} />
              <View style={styles.timelineText}>
                <Text style={styles.timelineTitle}>
                  {latestAiScan ? `Photo check complete (${latestAiScan.fireRiskScore}/100)` : 'Photo check pending'}
                </Text>
                <Text style={styles.timelineSub}>
                  {latestAiScan ? latestAiScan.summaryText : 'Take a photo of socket to run real-time fire safety audit.'}
                </Text>
              </View>
            </View>
            <View style={styles.timelineItem}>
              <MapPin size={18} color={C.orange} />
              <View style={styles.timelineText}>
                <Text style={styles.timelineTitle}>Electrician visit pending</Text>
                <Text style={styles.timelineSub}>Earthing resistance and MCB rating need physical sign-off.</Text>
              </View>
            </View>
            <View style={styles.timelineItem}>
              <BatteryCharging size={18} color={C.textMuted} />
              <View style={styles.timelineText}>
                <Text style={styles.timelineTitle}>RWA decision next</Text>
                <Text style={styles.timelineSub}>Packet with live QR verification will be shared after inspection.</Text>
              </View>
            </View>
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
    paddingBottom: 96,
    gap: S.lg,
  },
  vehicleStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
  },
  vehicleStripLabel: {
    color: C.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  vehicleScroll: {
    flexDirection: 'row',
    gap: S.xs,
  },
  vehicleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  vehicleChipActive: {
    borderColor: C.orange,
    backgroundColor: '#26150B',
  },
  vehicleChipText: {
    color: C.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  vehicleChipTextActive: {
    color: C.orange,
    fontWeight: '800',
  },
  morningCard: {
    gap: S.md,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: S.md,
  },
  modeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surfaceAlt,
  },
  modeToggleText: {
    color: C.textMuted,
    fontSize: 11,
    fontWeight: '800',
  },
  bigTitle: {
    color: C.text,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '900',
  },
  bodyText: {
    color: C.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: S.sm,
  },
  planFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.surfaceAlt,
    borderRadius: 8,
    padding: S.md,
    borderWidth: 1,
    borderColor: C.border,
    marginTop: 2,
  },
  planFooterCol: {
    alignItems: 'center',
  },
  planFooterLabel: {
    color: C.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  planFooterVal: {
    color: C.text,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    gap: S.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: '900',
  },
  sectionMeta: {
    color: C.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  timelineItem: {
    flexDirection: 'row',
    gap: S.md,
    paddingVertical: S.md,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  timelineText: {
    flex: 1,
  },
  timelineTitle: {
    color: C.text,
    fontSize: 14,
    fontWeight: '900',
  },
  timelineSub: {
    color: C.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
});
