import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Camera, History, AlertCircle } from 'lucide-react-native';
import { COLORS, STYLES } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.background, '#0f172a']} style={StyleSheet.absoluteFill} />
      
      {/* Header Personalizado */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bienvenido,</Text>
          <Text style={styles.username}>Agente Smith</Text>
        </View>
        <View style={styles.badge}>
          <View style={styles.statusDot} />
          <Text style={styles.badgeText}>ONLINE</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }}>
        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <StatCard label="Escaneos" value="142" />
          <StatCard label="Alertas" value="3" isAlert />
        </View>

        {/* Botón Principal de Acción */}
        <TouchableOpacity 
          style={styles.scanButton}
          activeOpacity={0.8}
          onPress={() => router.push('/scanner')}
        >
          <LinearGradient
            colors={[COLORS.primary, '#0099FF']}
            style={styles.scanGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <Camera size={48} color="#000" />
            <Text style={styles.scanText}>ESCANEAR PLACA</Text>
            <Text style={styles.scanSubtext}>Toque para iniciar cámara</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Actividad Reciente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actividad Reciente</Text>
          {/* Mock Data */}
          <ActivityItem plate="ABC-123" status="approved" time="10:42 AM" />
          <ActivityItem plate="XYZ-999" status="review" time="10:30 AM" />
          <ActivityItem plate="FNQ-202" status="approved" time="09:15 AM" />
        </View>
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value, isAlert }: any) {
  return (
    <View style={[styles.statCard, isAlert && { borderColor: COLORS.secondary }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActivityItem({ plate, status, time }: any) {
  const isReview = status === 'review';
  return (
    <View style={styles.activityItem}>
      <View style={styles.plateBox}>
        <Text style={styles.plateText}>{plate}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={[styles.statusText, { color: isReview ? COLORS.secondary : COLORS.success }]}>
          {isReview ? 'EN REVISIÓN' : 'APROBADO'}
        </Text>
        <Text style={styles.timeText}>{time}</Text>
      </View>
      <History size={20} color={COLORS.textDim} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24 },
  greeting: { color: COLORS.textDim, fontSize: 14 },
  username: { color: COLORS.text, fontSize: 24, fontWeight: 'bold' },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 240, 255, 0.1)', padding: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.primary },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success, marginRight: 6 },
  badgeText: { color: COLORS.primary, fontSize: 10, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', gap: 16 },
  statCard: { flex: 1, backgroundColor: COLORS.surface, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: COLORS.surfaceHighlight },
  statValue: { color: COLORS.text, fontSize: 32, fontWeight: 'bold' },
  statLabel: { color: COLORS.textDim, fontSize: 14 },
  scanButton: { height: 180, borderRadius: 24, overflow: 'hidden', ...STYLES.shadow },
  scanGradient: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  scanText: { fontSize: 20, fontWeight: '900', color: '#000', letterSpacing: 1 },
  scanSubtext: { fontSize: 14, color: 'rgba(0,0,0,0.6)' },
  section: { gap: 16 },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold' },
  activityItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, padding: 16, borderRadius: 12, borderBottomWidth: 1, borderBottomColor: COLORS.surfaceHighlight },
  plateBox: { backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 2, borderColor: '#000' },
  plateText: { color: '#000', fontWeight: 'bold', fontFamily: 'monospace' },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  timeText: { color: COLORS.textDim, fontSize: 12 }
});