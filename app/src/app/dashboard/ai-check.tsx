import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AlertCircle,
  AlertTriangle,
  Bot,
  Camera,
  Globe,
  Image as ImageIcon,
  Key,
  Layers,
  PhoneCall,
  Send,
  ShieldCheck,
  Wrench,
} from 'lucide-react-native';

import { AppHeader, AppScreen, Card, Metric, Pill, PrimaryButton } from '../../components/charge-ui';
import { ChargeColors as C, ChargeSpacing as S } from '../../constants/charge-theme';
import {
  AIVisionResult,
  analyzeInstallationPhoto,
  ChargeNOCGroupResult,
  DEFAULT_GEMINI_KEY,
  EquipmentClassification,
  getGeminiApiKey,
  getLatestScanResult,
  HardwareRecommendation,
  HAZARD_LABELS,
  screenSiteGroup,
  setGeminiApiKey,
  STATUS_META,
  testGeminiApiKey,
} from '../../lib/ai-vision-service';
import {
  ChatMessage,
  QUICK_PROBLEMS,
  sendChargeSathiQuery,
  SUPPORTED_LANGUAGES,
} from '../../lib/chargesathi-service';

const CLASSIFICATION_TAGS: { id: EquipmentClassification; label: string }[] = [
  { id: 'AUTO_DETECT', label: '✨ AI Auto-Detect' },
  { id: '16A_DEDICATED_SOCKET', label: '16A Power Socket' },
  { id: 'INDUSTRIAL_COMMANDO_PLUG', label: 'Commando Plug' },
  { id: 'MCB_DISTRIBUTION_PANEL', label: 'MCB / DB Box' },
  { id: 'STANDARD_5A_DOMESTIC_SOCKET', label: '5A Domestic' },
];

export default function AICheckScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  // Mode Switch: Vision Site Screener vs ChargeSathi Chatbot
  const [activeTab, setActiveTab] = useState<'vision' | 'chat'>('vision');

  // Vision Screening State
  const [cameraOpen, setCameraOpen] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [multiPhotos, setMultiPhotos] = useState<{ uri: string; base64?: string | null; label: string }[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<AIVisionResult | null>(null);
  const [groupResult, setGroupResult] = useState<ChargeNOCGroupResult | null>(null);
  const [hardwareResult, setHardwareResult] = useState<HardwareRecommendation | null>(null);
  const [selectedTag, setSelectedTag] = useState<EquipmentClassification>('AUTO_DETECT');

  // ChargeSathi Chatbot State
  const [selectedLang, setSelectedLang] = useState('hinglish');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Namaste! Main ChargeSathi hoon, aapka EV charging assistant. Home charging, public chargers, gun lock, MCB tripping ya safety related koi bhi sawal puchein.',
      timestamp: Date.now(),
      severity: 'low',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [activeEmergencyAlert, setActiveEmergencyAlert] = useState<string | null>(null);

  // API Key Settings Modal
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasApiKey, setHasApiKey] = useState(true);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyFeedback, setKeyFeedback] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const savedKey = await getGeminiApiKey();
      setApiKeyInput(savedKey || DEFAULT_GEMINI_KEY);
      setHasApiKey(Boolean(savedKey));

      const lastResult = await getLatestScanResult();
      if (lastResult) {
        setScanResult(lastResult);
        if (lastResult.photoUri) setPhotoUri(lastResult.photoUri);
        if (lastResult.hardwareRecommendation) setHardwareResult(lastResult.hardwareRecommendation);
      }
    })();
  }, []);

  // Camera & Image Handlers
  const openCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Camera permission', 'Camera permission enable karein ya Gallery option use karein.');
        return;
      }
    }
    setCameraOpen(true);
  };

  const capturePhoto = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.8,
        base64: true,
      });
      if (photo?.uri) {
        setPhotoUri(photo.uri);
        setCameraOpen(false);
        const newPhotoItem = { uri: photo.uri, base64: photo.base64 || null, label: `Photo #${multiPhotos.length + 1}` };
        setMultiPhotos(prev => [...prev, newPhotoItem]);
        executeSiteAnalysis(photo.uri, photo.base64 || null);
      }
    } catch {
      Alert.alert('Camera error', 'Photo capture nahi ho paya. Gallery option try karein.');
    }
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setPhotoUri(asset.uri);
        const newPhotoItem = { uri: asset.uri, base64: asset.base64 || null, label: `Photo #${multiPhotos.length + 1}` };
        setMultiPhotos(prev => [...prev, newPhotoItem]);
        executeSiteAnalysis(asset.uri, asset.base64 || null);
      }
    } catch (err) {
      Alert.alert('Gallery Error', 'Photo select nahi ho payi: ' + String(err));
    }
  };

  const executeSiteAnalysis = async (uri: string, base64: string | null) => {
    setIsScanning(true);
    try {
      const res = await analyzeInstallationPhoto({
        photoUri: uri,
        base64,
        manualTag: selectedTag,
      });
      setScanResult(res);
      if (res.hardwareRecommendation) {
        setHardwareResult(res.hardwareRecommendation);
      }
    } catch (err) {
      Alert.alert('Analysis error', 'Screening analyze karne mein error aaya: ' + String(err));
    } finally {
      setIsScanning(false);
    }
  };

  const runGroupScreening = async () => {
    if (multiPhotos.length === 0) {
      Alert.alert('No Photos', 'Kripya kam se kam 1 photo capture ya pick karein.');
      return;
    }
    setIsScanning(true);
    try {
      const groupData = await screenSiteGroup(
        multiPhotos.map((p, i) => ({ uri: p.uri, base64: p.base64, filename: `site_bay_img_${i + 1}.jpg` })),
        { chargerPowerKw: 3.3, chargerType: 'AC' }
      );
      setGroupResult(groupData.group);
      setHardwareResult(groupData.hardware);
      Alert.alert('Group Screening Complete', `Screened ${groupData.group.image_count} site photos. Status: ${groupData.group.group_status}`);
    } catch (err) {
      Alert.alert('Group screening error', String(err));
    } finally {
      setIsScanning(false);
    }
  };

  // ChargeSathi Chat Handlers
  const handleSendChat = async (userText: string) => {
    const textToSend = userText.trim();
    if (!textToSend || isSendingChat) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsSendingChat(true);

    try {
      const apiKey = await getGeminiApiKey();
      const reply = await sendChargeSathiQuery({
        query: textToSend,
        history: messages,
        languageCode: selectedLang,
        apiKey,
      });

      const botMsg: ChatMessage = {
        id: `m-${Date.now()}`,
        role: 'model',
        text: reply.text,
        timestamp: Date.now(),
        severity: reply.severity,
      };

      setMessages(prev => [...prev, botMsg]);

      if (reply.severity === 'high') {
        setActiveEmergencyAlert('High severity hazard detected: Please move away from equipment and dial emergency services if required.');
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          text: 'Error connecting to ChargeSathi engine: ' + String(err),
          timestamp: Date.now(),
          severity: 'low',
        },
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleQuickProblem = (query: string) => {
    handleSendChat(query);
  };

  const handleDialEmergency = () => {
    Linking.openURL('tel:112').catch(() => Alert.alert('Dial 112', 'Emergency helpline number: 112 / Fire 101'));
  };

  const handleSaveApiKey = async () => {
    setIsTestingKey(true);
    setKeyFeedback(null);
    try {
      const result = await testGeminiApiKey(apiKeyInput);
      if (result.success) {
        await setGeminiApiKey(apiKeyInput);
        setHasApiKey(true);
        setKeyFeedback('Key validated and saved successfully!');
        setTimeout(() => setShowKeyModal(false), 1200);
      } else {
        setKeyFeedback(result.message);
      }
    } catch (err: any) {
      setKeyFeedback('Validation error: ' + err.message);
    } finally {
      setIsTestingKey(false);
    }
  };

  const statusMeta = scanResult?.chargeNocResult?.screening_status
    ? STATUS_META[scanResult.chargeNocResult.screening_status]
    : scanResult?.decision === 'REJECTED_FIRE_HAZARD'
    ? STATUS_META.CORRECTION_REQUIRED
    : STATUS_META.CONTINUE_TO_ELECTRICIAN;

  return (
    <AppScreen>
      <SafeAreaView style={styles.safe}>
        <AppHeader
          title="ChargeNOC & ChargeSathi AI"
          subtitle="Vision Site Screening & Multilingual EV Assistant"
          showLogo
        />

        {/* Tab Switcher Header Strip */}
        <View style={styles.topTabBar}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('vision')}
            style={[styles.tabButton, activeTab === 'vision' && styles.tabButtonActive]}>
            <ShieldCheck size={18} color={activeTab === 'vision' ? C.orange : C.textMuted} />
            <Text style={[styles.tabButtonText, activeTab === 'vision' && styles.tabButtonTextActive]}>
              Site Screener (Vision)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('chat')}
            style={[styles.tabButton, activeTab === 'chat' && styles.tabButtonActive]}>
            <Bot size={18} color={activeTab === 'chat' ? C.orange : C.textMuted} />
            <Text style={[styles.tabButtonText, activeTab === 'chat' && styles.tabButtonTextActive]}>
              ChargeSathi Chatbot
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Config Strip */}
        <View style={styles.configStrip}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowKeyModal(true)}
            style={styles.keyBadge}>
            <Key size={14} color={C.amber} />
            <Text style={styles.keyBadgeText}>Gemini AI Config</Text>
            <View style={[styles.statusDot, { backgroundColor: hasApiKey ? C.green : C.red }]} />
          </TouchableOpacity>

          {activeEmergencyAlert && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleDialEmergency}
              style={styles.sosButton}>
              <PhoneCall size={14} color={C.white} />
              <Text style={styles.sosButtonText}>SOS 112</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* TAB 1: VISION SITE SCREENER */}
        {activeTab === 'vision' ? (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Camera / Capture Section */}
            <Card>
              <Text style={styles.cardHeaderTitle}>Installation Area Photo Screening</Text>
              <Text style={styles.cardHeaderSubtitle}>Analyzes wall dampness, exposed wiring, clearance & hardware</Text>

              {/* Tag Selector */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagScroll}>
                {CLASSIFICATION_TAGS.map(tag => (
                  <TouchableOpacity
                    key={tag.id}
                    activeOpacity={0.8}
                    onPress={() => setSelectedTag(tag.id)}
                    style={[
                      styles.tagChip,
                      selectedTag === tag.id && styles.tagChipActive,
                    ]}>
                    <Text
                      style={[
                        styles.tagChipText,
                        selectedTag === tag.id && styles.tagChipTextActive,
                      ]}>
                      {tag.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.photoActionRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={openCamera}
                  style={styles.actionBtn}>
                  <Camera size={20} color={C.white} />
                  <Text style={styles.actionBtnText}>Capture Bay</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={pickFromGallery}
                  style={[styles.actionBtn, styles.actionBtnOutline]}>
                  <ImageIcon size={20} color={C.orange} />
                  <Text style={[styles.actionBtnText, { color: C.orange }]}>Choose Photo</Text>
                </TouchableOpacity>
              </View>

              {/* Photo Preview Strip */}
              {multiPhotos.length > 0 && (
                <View style={styles.previewStripContainer}>
                  <Text style={styles.previewStripTitle}>Captured Site Photos ({multiPhotos.length}):</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewScroll}>
                    {multiPhotos.map((p, idx) => (
                      <View key={idx} style={styles.previewItem}>
                        <Image source={{ uri: p.uri }} style={styles.previewThumb} />
                        <Text style={styles.previewLabel}>{p.label}</Text>
                      </View>
                    ))}
                  </ScrollView>

                  {multiPhotos.length > 1 && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={runGroupScreening}
                      style={styles.groupScreenBtn}>
                      <Layers size={16} color={C.white} />
                      <Text style={styles.groupScreenBtnText}>Run Multi-Photo Site Aggregation</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {photoUri && (
                <View style={styles.mainPreviewBox}>
                  <Image source={{ uri: photoUri }} style={styles.mainPreviewImage} />
                  {isScanning && (
                    <View style={styles.scanOverlay}>
                      <ActivityIndicator size="large" color={C.orange} />
                      <Text style={styles.scanOverlayText}>Evaluating with ChargeNOC AI & Gemini Vision...</Text>
                    </View>
                  )}
                </View>
              )}
            </Card>

            {/* Group Aggregation Banner */}
            {groupResult && (
              <View style={styles.groupBanner}>
                <Layers size={18} color={C.orange} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.groupBannerTitle}>Site Multi-Photo Status: {groupResult.group_status}</Text>
                  <Text style={styles.groupBannerSubtitle}>{groupResult.image_count} photos evaluated collectively</Text>
                </View>
              </View>
            )}

            {/* Screening Decision Banner */}
            {scanResult && (
              <View
                style={[
                  styles.verdictCard,
                  { borderColor: statusMeta.color, backgroundColor: C.panel },
                ]}>
                <View style={styles.verdictHeader}>
                  <Text style={styles.verdictEmoji}>{statusMeta.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.verdictTitle, { color: statusMeta.color }]}>
                      {statusMeta.label}
                    </Text>
                    <Text style={styles.verdictDesc}>{statusMeta.description}</Text>
                  </View>
                </View>

                {/* Score & Hazard Badges */}
                <View style={styles.metricsRow}>
                  <Metric
                    label="Fire Risk Score"
                    value={`${scanResult.fireRiskScore}/100`}
                    color={scanResult.fireRiskScore >= 80 ? C.green : scanResult.fireRiskScore >= 50 ? C.amber : C.red}
                  />
                  <Metric
                    label="Safety Grade"
                    value={scanResult.safetyGrade.split(' ')[0]}
                    color={scanResult.safetyGrade.startsWith('A') ? C.green : scanResult.safetyGrade.startsWith('B') ? C.amber : C.red}
                  />
                  <Metric
                    label="Hazard Level"
                    value={scanResult.hazardLevel}
                    color={scanResult.hazardLevel === 'LOW' ? C.green : C.red}
                  />
                </View>
              </View>
            )}

            {/* Detected Hazards Breakdown */}
            {scanResult?.chargeNocResult?.hazards && scanResult.chargeNocResult.hazards.length > 0 && (
              <Card>
                <Text style={styles.cardHeaderTitle}>Visual Hazard Findings</Text>
                <Text style={styles.cardHeaderSubtitle}>Analyzed against CEA Regulations & IS 732 Standards</Text>
                {scanResult.chargeNocResult.hazards.map((h, i) => (
                  <View key={i} style={styles.hazardItemCard}>
                    <View style={styles.hazardItemHeader}>
                      <AlertTriangle
                        size={16}
                        color={h.severity === 'high' ? C.red : h.severity === 'medium' ? C.amber : C.green}
                      />
                      <Text style={styles.hazardItemTitle}>{HAZARD_LABELS[h.type]?.en || h.type}</Text>
                      <Pill
                        label={h.severity.toUpperCase()}
                        tone={h.severity === 'high' ? 'danger' : h.severity === 'medium' ? 'warn' : 'good'}
                      />
                    </View>
                    <Text style={styles.hazardEvidence}>{h.evidence}</Text>
                    <Text style={styles.hazardConfidence}>Confidence: {Math.round(h.confidence * 100)}%</Text>
                  </View>
                ))}
              </Card>
            )}

            {/* Preliminary Hardware Checklist */}
            {hardwareResult && hardwareResult.hardware_items.length > 0 && (
              <Card>
                <Text style={styles.cardHeaderTitle}>Preliminary Hardware Checklist</Text>
                <Text style={styles.cardHeaderSubtitle}>Rule-based pre-requisites for electrician inspection</Text>

                {hardwareResult.blocked_from_installation_progress && (
                  <View style={styles.blockNotice}>
                    <AlertCircle size={16} color={C.red} />
                    <Text style={styles.blockNoticeText}>
                      Installation progress blocked until visible hazards are rectified.
                    </Text>
                  </View>
                )}

                {hardwareResult.hardware_items.map((item, idx) => (
                  <View key={idx} style={styles.hwItem}>
                    <View style={styles.hwIconBox}>
                      <Wrench size={16} color={C.orange} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.hwCat}>{item.category.replace(/_/g, ' ').toUpperCase()}</Text>
                      <Text style={styles.hwReason}>{item.reason}</Text>
                      <Text style={styles.hwInputs}>
                        Electrician must verify: {item.missing_inputs.join(', ')}
                      </Text>
                    </View>
                  </View>
                ))}

                <Text style={styles.disclaimerText}>{hardwareResult.notice}</Text>
              </Card>
            )}

            {/* Attach to NOC Packet Action */}
            {scanResult && (
              <PrimaryButton
                label="Attach Findings to Society NOC Packet"
                onPress={() => router.push('/dashboard/new-request' as never)}
              />
            )}
          </ScrollView>
        ) : (
          /* TAB 2: CHARGESATHI CHATBOT */
          <View style={styles.chatContainer}>
            {/* Language Selector Strip */}
            <View style={styles.langBar}>
              <Globe size={16} color={C.textMuted} />
              <Text style={styles.langBarLabel}>Language:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.langScroll}>
                {SUPPORTED_LANGUAGES.map(lang => (
                  <TouchableOpacity
                    key={lang.code}
                    activeOpacity={0.8}
                    onPress={() => setSelectedLang(lang.code)}
                    style={[
                      styles.langChip,
                      selectedLang === lang.code && styles.langChipActive,
                    ]}>
                    <Text
                      style={[
                        styles.langChipText,
                        selectedLang === lang.code && styles.langChipTextActive,
                      ]}>
                      {lang.native}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Quick Problem Shortcuts */}
            <View style={styles.quickPromptSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickScroll}>
                {QUICK_PROBLEMS.map(p => (
                  <TouchableOpacity
                    key={p.id}
                    activeOpacity={0.8}
                    onPress={() => handleQuickProblem(p.query)}
                    style={styles.quickChip}>
                    <Text style={styles.quickChipIcon}>{p.icon}</Text>
                    <Text style={styles.quickChipLabel}>{p.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Conversation Feed */}
            <ScrollView
              contentContainerStyle={styles.chatFeed}
              showsVerticalScrollIndicator={false}>
              {messages.map(m => (
                <View
                  key={m.id}
                  style={[
                    styles.messageBubble,
                    m.role === 'user' ? styles.userBubble : styles.modelBubble,
                    m.severity === 'high' && styles.highSevBubble,
                  ]}>
                  {m.role === 'model' && (
                    <View style={styles.botMetaRow}>
                      <Text style={styles.botName}>ChargeSathi</Text>
                      {m.severity && (
                        <View
                          style={[
                            styles.sevBadge,
                            m.severity === 'high'
                              ? styles.sevBadgeHigh
                              : m.severity === 'medium'
                              ? styles.sevBadgeMedium
                              : styles.sevBadgeLow,
                          ]}>
                          <Text style={styles.sevBadgeText}>
                            {m.severity === 'high' ? '⚠️ HIGH SEVERITY' : m.severity === 'medium' ? '⚡ MEDIUM' : 'ℹ️ NORMAL'}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                  <Text style={[styles.messageText, m.role === 'user' && styles.userMessageText]}>
                    {m.text}
                  </Text>
                </View>
              ))}

              {isSendingChat && (
                <View style={[styles.messageBubble, styles.modelBubble]}>
                  <ActivityIndicator size="small" color={C.orange} />
                  <Text style={styles.typingText}>ChargeSathi analyzing safety protocols...</Text>
                </View>
              )}
            </ScrollView>

            {/* Composer Input Bar */}
            <View style={styles.composerBar}>
              <TextInput
                value={chatInput}
                onChangeText={setChatInput}
                placeholder="Ask about EV charging problem or error..."
                placeholderTextColor={C.textMuted}
                style={styles.composerInput}
                multiline
              />
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleSendChat(chatInput)}
                disabled={isSendingChat || !chatInput.trim()}
                style={[
                  styles.sendButton,
                  (!chatInput.trim() || isSendingChat) && styles.sendButtonDisabled,
                ]}>
                <Send size={18} color={C.white} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* API Key Modal */}
        <Modal visible={showKeyModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Gemini AI Key Configuration</Text>
              <Text style={styles.modalSub}>
                Enter your Google AI Studio key (AIzaSy...) for real-time Multimodal Vision & Multilingual Assistant.
              </Text>

              <TextInput
                value={apiKeyInput}
                onChangeText={setApiKeyInput}
                placeholder="AIzaSy..."
                placeholderTextColor={C.textMuted}
                style={styles.keyInput}
                autoCapitalize="none"
              />

              {keyFeedback && (
                <Text
                  style={[
                    styles.keyFeedback,
                    { color: keyFeedback.includes('successfully') ? C.green : C.red },
                  ]}>
                  {keyFeedback}
                </Text>
              )}

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowKeyModal(false)}
                  style={[styles.modalBtn, styles.modalBtnCancel]}>
                  <Text style={styles.modalBtnCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleSaveApiKey}
                  disabled={isTestingKey}
                  style={[styles.modalBtn, styles.modalBtnSave]}>
                  {isTestingKey ? (
                    <ActivityIndicator size="small" color={C.white} />
                  ) : (
                    <Text style={styles.modalBtnSaveText}>Test & Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Fullscreen Camera Modal */}
        {cameraOpen && (
          <Modal visible={cameraOpen} animationType="fade">
            <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back">
              <SafeAreaView style={styles.cameraOverlay}>
                <View style={styles.cameraHeader}>
                  <Text style={styles.cameraTitle}>Scan EV Socket / Meter Room</Text>
                  <TouchableOpacity onPress={() => setCameraOpen(false)} style={styles.cameraCloseBtn}>
                    <Text style={styles.cameraCloseText}>Close</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.cameraReticle} />

                <View style={styles.cameraFooter}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={capturePhoto}
                    style={styles.shutterBtn}>
                    <View style={styles.shutterInner} />
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            </CameraView>
          </Modal>
        )}
      </SafeAreaView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topTabBar: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    padding: 4,
    marginHorizontal: S.lg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: S.sm,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: C.panel,
  },
  tabButtonText: {
    color: C.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  tabButtonTextActive: {
    color: C.orange,
  },
  configStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: S.lg,
    marginBottom: S.sm,
  },
  keyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  keyBadgeText: {
    color: C.text,
    fontSize: 12,
    fontWeight: '600',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  sosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.red,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  sosButtonText: {
    color: C.white,
    fontSize: 12,
    fontWeight: '800',
  },
  content: {
    paddingHorizontal: S.lg,
    paddingBottom: 40,
    gap: S.md,
  },
  cardHeaderTitle: {
    color: C.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  cardHeaderSubtitle: {
    color: C.textMuted,
    fontSize: 12,
    marginBottom: S.sm,
  },
  tagScroll: {
    flexDirection: 'row',
    marginBottom: S.sm,
  },
  tagChip: {
    backgroundColor: C.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    marginRight: 6,
    borderWidth: 1,
    borderColor: C.border,
  },
  tagChipActive: {
    borderColor: C.orange,
    backgroundColor: 'rgba(255, 122, 26, 0.12)',
  },
  tagChipText: {
    color: C.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  tagChipTextActive: {
    color: C.orange,
    fontWeight: '700',
  },
  photoActionRow: {
    flexDirection: 'row',
    gap: S.sm,
    marginTop: S.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.orange,
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: C.orange,
  },
  actionBtnText: {
    color: C.white,
    fontSize: 14,
    fontWeight: '700',
  },
  previewStripContainer: {
    marginTop: S.md,
  },
  previewStripTitle: {
    color: C.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  previewScroll: {
    flexDirection: 'row',
  },
  previewItem: {
    marginRight: 10,
    alignItems: 'center',
  },
  previewThumb: {
    width: 68,
    height: 68,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.border,
  },
  previewLabel: {
    color: C.textMuted,
    fontSize: 10,
    marginTop: 3,
  },
  groupScreenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.orange,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  groupScreenBtnText: {
    color: C.orange,
    fontSize: 12,
    fontWeight: '700',
  },
  mainPreviewBox: {
    height: 180,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: S.md,
    borderWidth: 1,
    borderColor: C.border,
  },
  mainPreviewImage: {
    width: '100%',
    height: '100%',
  },
  scanOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(9, 10, 12, 0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scanOverlayText: {
    color: C.white,
    fontSize: 12,
    fontWeight: '600',
  },
  groupBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 122, 26, 0.12)',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.orange,
  },
  groupBannerTitle: {
    color: C.orange,
    fontSize: 13,
    fontWeight: '800',
  },
  groupBannerSubtitle: {
    color: C.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  verdictCard: {
    borderWidth: 2,
    borderRadius: 12,
    padding: S.md,
    gap: S.md,
  },
  verdictHeader: {
    flexDirection: 'row',
    gap: S.sm,
    alignItems: 'flex-start',
  },
  verdictEmoji: {
    fontSize: 28,
  },
  verdictTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  verdictDesc: {
    color: C.textMuted,
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: S.sm,
  },
  hazardItemCard: {
    backgroundColor: C.surfaceAlt,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 8,
    gap: 4,
  },
  hazardItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hazardItemTitle: {
    flex: 1,
    color: C.text,
    fontSize: 13,
    fontWeight: '700',
  },
  hazardEvidence: {
    color: C.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  hazardConfidence: {
    color: C.amber,
    fontSize: 11,
    fontWeight: '600',
  },
  blockNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 85, 85, 0.12)',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.red,
    marginBottom: 10,
  },
  blockNoticeText: {
    flex: 1,
    color: C.red,
    fontSize: 12,
    fontWeight: '700',
  },
  hwItem: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: C.surfaceAlt,
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  hwIconBox: {
    marginTop: 2,
  },
  hwCat: {
    color: C.text,
    fontSize: 12,
    fontWeight: '800',
  },
  hwReason: {
    color: C.textMuted,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  hwInputs: {
    color: C.amber,
    fontSize: 11,
    marginTop: 4,
  },
  disclaimerText: {
    color: C.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 6,
  },
  // Chat styles
  chatContainer: {
    flex: 1,
  },
  langBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: S.lg,
    paddingBottom: 6,
  },
  langBarLabel: {
    color: C.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  langScroll: {
    flexDirection: 'row',
  },
  langChip: {
    backgroundColor: C.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 6,
    borderWidth: 1,
    borderColor: C.border,
  },
  langChipActive: {
    borderColor: C.orange,
    backgroundColor: C.panel,
  },
  langChipText: {
    color: C.textMuted,
    fontSize: 11,
  },
  langChipTextActive: {
    color: C.orange,
    fontWeight: '700',
  },
  quickPromptSection: {
    paddingHorizontal: S.lg,
    paddingBottom: 8,
  },
  quickScroll: {
    gap: 6,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  quickChipIcon: {
    fontSize: 13,
  },
  quickChipLabel: {
    color: C.text,
    fontSize: 11,
    fontWeight: '600',
  },
  chatFeed: {
    paddingHorizontal: S.lg,
    paddingBottom: 16,
    gap: 10,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 12,
    maxWidth: '85%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: C.orange,
  },
  modelBubble: {
    alignSelf: 'flex-start',
    backgroundColor: C.surfaceAlt,
    borderWidth: 1,
    borderColor: C.border,
  },
  highSevBubble: {
    borderColor: C.red,
    backgroundColor: 'rgba(239, 85, 85, 0.12)',
  },
  botMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 8,
  },
  botName: {
    color: C.orange,
    fontSize: 11,
    fontWeight: '800',
  },
  sevBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sevBadgeHigh: {
    backgroundColor: C.red,
  },
  sevBadgeMedium: {
    backgroundColor: C.amber,
  },
  sevBadgeLow: {
    backgroundColor: 'rgba(51, 209, 122, 0.2)',
  },
  sevBadgeText: {
    color: C.white,
    fontSize: 9,
    fontWeight: '800',
  },
  messageText: {
    color: C.text,
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: C.white,
    fontWeight: '500',
  },
  typingText: {
    color: C.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  composerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: S.md,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  composerInput: {
    flex: 1,
    backgroundColor: C.surfaceAlt,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: C.text,
    fontSize: 14,
    maxHeight: 80,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: S.xl,
  },
  modalCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: S.xl,
    borderWidth: 1,
    borderColor: C.border,
    gap: S.md,
  },
  modalTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: '800',
  },
  modalSub: {
    color: C.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  keyInput: {
    backgroundColor: C.surfaceAlt,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    padding: 12,
    color: C.text,
    fontSize: 13,
  },
  keyFeedback: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: S.sm,
  },
  modalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalBtnCancel: {
    backgroundColor: C.surfaceAlt,
  },
  modalBtnCancelText: {
    color: C.textMuted,
    fontWeight: '600',
  },
  modalBtnSave: {
    backgroundColor: C.orange,
  },
  modalBtnSaveText: {
    color: C.white,
    fontWeight: '700',
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: S.lg,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  cameraTitle: {
    color: C.white,
    fontSize: 16,
    fontWeight: '700',
  },
  cameraCloseBtn: {
    padding: 6,
  },
  cameraCloseText: {
    color: C.orange,
    fontSize: 14,
    fontWeight: '700',
  },
  cameraReticle: {
    alignSelf: 'center',
    width: 260,
    height: 260,
    borderWidth: 2,
    borderColor: C.orange,
    borderRadius: 16,
    borderStyle: 'dashed',
  },
  cameraFooter: {
    padding: S.xl,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  shutterBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.orange,
  },
});
