import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BatteryCharging,
  Gauge,
  Play,
  ReceiptText,
  Square,
  Thermometer,
} from 'lucide-react-native';

import { AppHeader, AppScreen, Card, FeatureRow, Metric, Pill, PrimaryButton } from '../../components/charge-ui';
import { ChargeColors as C, ChargeSpacing as S } from '../../constants/charge-theme';
import {
  calculateMonthlyBillMetrics,
  ChargingSession,
  saveSession,
} from '../../lib/telemetry-service';
import { getSavedVehicleId, EV_DATABASE } from '../../lib/load-planner-service';

export default function BillingScreen() {
  const [metrics, setMetrics] = useState<any>(null);

  // Live real-time charging session state
  const [isCharging, setIsCharging] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [livePowerKw, setLivePowerKw] = useState(3.25);
  const [liveKwh, setLiveKwh] = useState(0.0);
  const [liveCost, setLiveCost] = useState(0.0);
  const [liveTemp, setLiveTemp] = useState(38.2);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshBilling = useCallback(async () => {
    const vid = await getSavedVehicleId();
    const vehicle = EV_DATABASE.find(v => v.id === vid);
    const data = await calculateMonthlyBillMetrics(vehicle);
    setMetrics(data);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const vid = await getSavedVehicleId();
      const vehicle = EV_DATABASE.find(v => v.id === vid);
      const data = await calculateMonthlyBillMetrics(vehicle);
      if (active) {
        setMetrics(data);
      }
    })();
    return () => {
      active = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startChargingSession = () => {
    setIsCharging(true);
    setSessionSeconds(0);
    setLiveKwh(0.0);
    setLiveCost(0.0);
    setLiveTemp(38.2);

    timerRef.current = setInterval(() => {
      setSessionSeconds(prev => {
        const nextSec = prev + 1;
        // Calculate incremental kWh: power (kW) * time (hours)
        // Simulate minor grid voltage fluctuations (3.2 kW to 3.32 kW)
        const powerJitter = 3.25 + (Math.sin(nextSec / 5) * 0.08);
        setLivePowerKw(Number(powerJitter.toFixed(2)));

        const addedKwh = (powerJitter * (nextSec / 3600));
        setLiveKwh(Number(addedKwh.toFixed(3)));

        const addedCost = addedKwh * 6.2; // Rs 6.20 / kWh
        setLiveCost(Number(addedCost.toFixed(2)));

        // Subtle temperature rise from ambient 38.2 to 42.5
        const temp = 38.2 + Math.min(4.5, nextSec * 0.08);
        setLiveTemp(Number(temp.toFixed(1)));

        return nextSec;
      });
    }, 1000);
  };

  const stopChargingSession = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsCharging(false);

    if (liveKwh > 0.01) {
      const newSession: ChargingSession = {
        id: `sess-${Date.now()}`,
        startTime: Date.now() - sessionSeconds * 1000,
        endTime: Date.now(),
        durationSeconds: sessionSeconds,
        energyKwh: Number(liveKwh.toFixed(2)),
        costRupees: Math.max(1, Math.round(liveCost)),
        vehicleName: 'Ather 450X',
        avgPowerKw: livePowerKw,
        peakCurrentAmps: 14.8,
        maxTempCelsius: liveTemp,
        status: 'COMPLETED',
        tariffPerKwh: 6.2,
      };
      await saveSession(newSession);
      await refreshBilling();
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <AppScreen>
      <SafeAreaView style={styles.safe}>
        <AppHeader title="Bills and Savings" subtitle="Real-time virtual meter & transparent reconciliation" />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Live Charging Session Controller */}
          <Card tone="highlight" style={styles.liveCard}>
            <View style={styles.rowBetween}>
              <Pill
                label={isCharging ? 'CHARGING IN PROGRESS' : 'VIRTUAL METER READY'}
                tone={isCharging ? 'good' : 'neutral'}
              />
              <Text style={styles.liveTimerText}>
                {isCharging ? formatTimer(sessionSeconds) : 'Idle'}
              </Text>
            </View>

            {isCharging ? (
              <View style={styles.liveMeters}>
                <View style={styles.liveMeterRow}>
                  <View style={styles.liveMeterItem}>
                    <Text style={styles.liveMeterLabel}>Power Draw</Text>
                    <Text style={styles.liveMeterVal}>{livePowerKw} kW</Text>
                  </View>
                  <View style={styles.liveMeterItem}>
                    <Text style={styles.liveMeterLabel}>Delivered</Text>
                    <Text style={[styles.liveMeterVal, { color: C.green }]}>{liveKwh} kWh</Text>
                  </View>
                  <View style={styles.liveMeterItem}>
                    <Text style={styles.liveMeterLabel}>Session Cost</Text>
                    <Text style={[styles.liveMeterVal, { color: C.orange }]}>₹{liveCost}</Text>
                  </View>
                </View>
                <View style={styles.tempBadge}>
                  <Thermometer size={14} color={liveTemp > 45 ? C.red : C.amber} />
                  <Text style={styles.tempText}>Socket Temp: {liveTemp}°C (Safe &lt;65°C)</Text>
                </View>
                <PrimaryButton
                  label="Stop Session"
                  icon={Square}
                  variant="danger"
                  onPress={stopChargingSession}
                />
              </View>
            ) : (
              <View style={styles.startSessionBox}>
                <Text style={styles.startTitle}>Test Real-Time EV Session</Text>
                <Text style={styles.startSub}>
                  Start an active charging session to see live wattage telemetry, thermal tracking, and real-time cost calculation.
                </Text>
                <PrimaryButton
                  label="Start Live Charging"
                  icon={Play}
                  onPress={startChargingSession}
                />
              </View>
            )}
          </Card>

          {/* Monthly Bill Summary */}
          {metrics && (
            <Card tone="highlight" style={styles.card}>
              <View style={styles.rowBetween}>
                <Pill label={metrics.monthLabel} tone="warn" />
                <Pill label="Reconciled" tone="good" />
              </View>
              <Text style={styles.amount}>₹{metrics.totalBillRupees}</Text>
              <Text style={styles.caption}>
                {metrics.finalShareKwh} kWh charged across {metrics.sessionCount} sessions. Society line correction applied.
              </Text>
              <View style={styles.metricsRow}>
                <Metric label="Petrol Saved" value={`₹${metrics.netPetrolSavedRupees}`} color={C.green} />
                <Metric label="CO2 Avoided" value={`${metrics.co2AvoidedKg} kg`} color={C.blue} />
              </View>
            </Card>
          )}

          {/* Reconciled Working Rows */}
          {metrics && (
            <Card>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Raw Virtual Meter Sum</Text>
                <Text style={styles.billValue}>{metrics.totalRawKwh} kWh</Text>
              </View>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Society Meter Correction (-5.4%)</Text>
                <Text style={[styles.billValue, { color: C.green }]}>{metrics.correctionKwh} kWh</Text>
              </View>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Final Reconciled Share</Text>
                <Text style={styles.billValue}>{metrics.finalShareKwh} kWh</Text>
              </View>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Tariff Applied</Text>
                <Text style={styles.billValue}>₹{metrics.tariffApplied} / kWh</Text>
              </View>
            </Card>
          )}

          {/* Telemetry Feature Rows */}
          <Card>
            <FeatureRow
              color={C.orange}
              icon={BatteryCharging}
              title="Last Session"
              subtitle={`${metrics?.lastSession ? `${metrics.lastSession.energyKwh} kWh at ${metrics.lastSession.avgPowerKw} kW avg` : 'No recent session'}`}
              trailing={<Pill label={`${metrics?.lastSession?.energyKwh || 10.5} kWh`} tone="neutral" />}
            />
            <FeatureRow
              color={C.blue}
              icon={Gauge}
              title="Line Loss Variance"
              subtitle="Virtual meter was within 5.4% of society master sub-meter"
              trailing={<Pill label="Audited" tone="info" />}
            />
            <FeatureRow
              color={C.amber}
              icon={ReceiptText}
              title="Society Payment Status"
              subtitle="Direct society maintenance ledger reconciliation"
              trailing={<Pill label="Reconciled" tone="good" />}
            />
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
  liveCard: {
    gap: S.md,
  },
  liveTimerText: {
    color: C.orange,
    fontSize: 14,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  startSessionBox: {
    gap: S.sm,
  },
  startTitle: {
    color: C.text,
    fontSize: 16,
    fontWeight: '800',
  },
  startSub: {
    color: C.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  liveMeters: {
    gap: S.md,
  },
  liveMeterRow: {
    flexDirection: 'row',
    gap: S.sm,
  },
  liveMeterItem: {
    flex: 1,
    backgroundColor: C.surfaceAlt,
    padding: S.sm,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
  },
  liveMeterLabel: {
    color: C.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  liveMeterVal: {
    color: C.text,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  tempBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
  },
  tempText: {
    color: C.textMuted,
    fontSize: 12,
    fontWeight: '700',
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
  amount: {
    color: C.text,
    fontSize: 42,
    fontWeight: '900',
  },
  caption: {
    color: C.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: S.sm,
  },
  billRow: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: S.md,
  },
  billLabel: {
    color: C.textMuted,
    fontSize: 13,
    flex: 1,
  },
  billValue: {
    color: C.text,
    fontSize: 14,
    fontWeight: '900',
  },
});
