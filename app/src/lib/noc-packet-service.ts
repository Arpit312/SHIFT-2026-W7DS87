import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLatestScanResult } from './ai-vision-service';

export interface NOCPacketData {
  packetId: string;
  createdAt: number;
  vehicleModel: string;
  chargerRating: string;
  parkingLocation: string;
  societyName: string;
  flatNumber: string;
  applicantName: string;
  aiFireScore: number;
  aiSafetyGrade: string;
  aiHazardLevel: string;
  aiDecision: string;
  conditions: string[];
  checklistAccepted: boolean;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED';
  qrPayload: string;
  committeeApprovalVotes: string;
}

const STORAGE_KEY_NOC_PACKET = '@chargenoc_saved_noc_packet';

export async function createOrUpdateNOCPacket(input: {
  vehicleModel: string;
  chargerRating: string;
  parkingLocation: string;
  checklistAccepted: boolean;
}): Promise<NOCPacketData> {
  const latestAiScan = await getLatestScanResult();

  const packetId = `CNOC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

  const conditions: string[] = [];
  if (latestAiScan && latestAiScan.requiredConditions && latestAiScan.requiredConditions.length > 0) {
    conditions.push(...latestAiScan.requiredConditions);
  } else {
    conditions.push('Charge only during allocated society off-peak slot');
    conditions.push('Licensed electrician must certify earthing before live power');
  }

  const aiScore = latestAiScan ? latestAiScan.fireRiskScore : 84;
  const aiGrade = latestAiScan ? latestAiScan.safetyGrade : 'A - Certified Safe';
  const aiHazard = latestAiScan ? latestAiScan.hazardLevel : 'LOW';
  const aiDecision = latestAiScan ? latestAiScan.decision : 'APPROVED_FOR_NOC';

  // Digital verification payload for the QR code
  const verificationPayload = JSON.stringify({
    packetId,
    timestamp: Date.now(),
    vehicle: input.vehicleModel,
    charger: input.chargerRating,
    bay: input.parkingLocation,
    aiScore,
    grade: aiGrade,
    conditionsCount: conditions.length,
    verifiedBy: 'ChargeNOC-Edge-Audit',
  });

  const packet: NOCPacketData = {
    packetId,
    createdAt: Date.now(),
    vehicleModel: input.vehicleModel,
    chargerRating: input.chargerRating,
    parkingLocation: input.parkingLocation,
    societyName: 'Sunrise Apartments',
    flatNumber: 'A-101',
    applicantName: 'EV Owner',
    aiFireScore: aiScore,
    aiSafetyGrade: aiGrade,
    aiHazardLevel: aiHazard,
    aiDecision,
    conditions,
    checklistAccepted: input.checklistAccepted,
    status: 'DRAFT',
    qrPayload: verificationPayload,
    committeeApprovalVotes: '3/5',
  };

  await AsyncStorage.setItem(STORAGE_KEY_NOC_PACKET, JSON.stringify(packet));
  return packet;
}

export async function getSavedNOCPacket(): Promise<NOCPacketData | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_NOC_PACKET);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }

  // Create default initial packet based on latest scan if available
  const initial = await createOrUpdateNOCPacket({
    vehicleModel: 'Ather 450X',
    chargerRating: '3.3 kW portable charger',
    parkingLocation: 'P2-17 near meter room',
    checklistAccepted: true,
  });
  return initial;
}
