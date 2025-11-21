import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, CheckCircle, AlertTriangle, User, FileText, XCircle, Loader } from 'lucide-react-native';
import { COLORS, STYLES } from '@/constants/theme';

// Datos Mock Actualizados
const HISTORY_DATA = [
  {
    id: '1',
    plate: 'ABC-123',
    status: 'approved',
    date: '20 Nov, 14:30',
    officer: 'Oficial Ramirez',
    comment: 'Vehículo mal estacionado en zona rígida.',
    img: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80'
  },
  {
    id: '2',
    plate: 'XYZ-987',
    status: 'review',
    date: '20 Nov, 12:15',
    officer: 'Sgt. Mendoza',
    comment: 'Posible placa adulterada, se requiere verificación manual.',
    img: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80'
  },
  {
    id: '3',
    plate: 'LMN-456',
    status: 'rejected',
    date: '19 Nov, 09:45',
    officer: 'Sistema AutoScan',
    comment: 'Imagen borrosa, no se pudo identificar la placa.',
    img: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80'
  },
];

export default function HistoryScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.background, '#0f172a']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Text style={styles.title}>Historial de Denuncias</Text>
        <Text style={styles.subtitle}>Seguimiento de casos enviados</Text>
      </View>

      <FlatList
        data={HISTORY_DATA}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        renderItem={({ item }) => <HistoryCard item={item} />}
      />
    </View>
  );
}

function HistoryCard({ item }: any) {
  return (
    <View style={styles.card}>
      {/* Header: Placa y Estado */}
      <View style={styles.cardHeader}>
        <View style={styles.plateBadge}>
          <Text style={styles.plateText}>{item.plate}</Text>
        </View>
        <StatusBadge status={item.status} />
      </View>

      {/* Content: Imagen e Info */}
      <View style={styles.cardContent}>
        <Image source={{ uri: item.img }} style={styles.evidenceImg} />

        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <User size={14} color={COLORS.primary} />
            <Text style={styles.infoText} numberOfLines={1}>{item.officer}</Text>
          </View>

          <View style={styles.infoRow}>
            <FileText size={14} color={COLORS.textDim} />
            <Text style={styles.commentText} numberOfLines={2}>{item.comment}</Text>
          </View>
        </View>
      </View>

      {/* Footer: Fecha */}
      <View style={styles.cardFooter}>
        <Clock size={12} color={COLORS.textDim} />
        <Text style={styles.dateText}>{item.date}</Text>
      </View>
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  let color = COLORS.success;
  let text = "APROBADO";
  let Icon = CheckCircle;
  let bg = "rgba(0, 255, 148, 0.1)";

  if (status === 'review') {
    color = COLORS.primary;
    text = "EN REVISIÓN";
    Icon = Loader;
    bg = "rgba(0, 240, 255, 0.1)";
  }
  if (status === 'rejected') {
    color = COLORS.error;
    text = "RECHAZADO";
    Icon = XCircle;
    bg = "rgba(255, 0, 85, 0.1)";
  }

  return (
    <View style={[styles.statusBadge, { backgroundColor: bg, borderColor: color }]}>
      <Icon color={color} size={12} />
      <Text style={[styles.statusText, { color: color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 60 },
  header: { paddingHorizontal: 24, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textDim, marginTop: 4 },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceHighlight,
    overflow: 'hidden'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceHighlight
  },
  plateBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#000'
  },
  plateText: { color: '#000', fontWeight: 'bold', fontFamily: 'monospace', fontSize: 16 },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1
  },
  statusText: { fontSize: 10, fontWeight: 'bold' },

  cardContent: { flexDirection: 'row', padding: 16, gap: 16 },
  evidenceImg: { width: 80, height: 80, borderRadius: 8, backgroundColor: COLORS.surfaceHighlight },
  infoContainer: { flex: 1, gap: 8 },
  infoRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  infoText: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  commentText: { color: COLORS.textDim, fontSize: 12, lineHeight: 18 },

  cardFooter: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  dateText: { color: COLORS.textDim, fontSize: 12 }
});