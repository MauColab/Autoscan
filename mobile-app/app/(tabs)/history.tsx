import { View, Text, StyleSheet, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, CheckCircle, AlertTriangle } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';

// Datos Mock
const HISTORY_DATA = [
  { id: '1', plate: 'ABC-123', status: 'approved', date: '20 Nov, 14:30' },
  { id: '2', plate: 'XYZ-987', status: 'review', date: '20 Nov, 12:15' },
  { id: '3', plate: 'LMN-456', status: 'approved', date: '19 Nov, 09:45' },
  { id: '4', plate: 'JQK-111', status: 'rejected', date: '18 Nov, 16:20' },
];

export default function HistoryScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.background, '#0f172a']} style={StyleSheet.absoluteFill} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Historial de Escaneos</Text>
      </View>

      <FlatList
        data={HISTORY_DATA}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.plateBadge}>
                <Text style={styles.plateText}>{item.plate}</Text>
              </View>
              <StatusIcon status={item.status} />
            </View>
            <View style={styles.cardFooter}>
              <Clock size={14} color={COLORS.textDim} />
              <Text style={styles.dateText}>{item.date}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

function StatusIcon({ status }: { status: string }) {
  let color = COLORS.success;
  let Icon = CheckCircle;

  if (status === 'review') { color = COLORS.primary; Icon = AlertTriangle; }
  if (status === 'rejected') { color = COLORS.error; Icon = AlertTriangle; }

  return <Icon color={color} size={20} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 60 },
  header: { paddingHorizontal: 24, marginBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  card: { 
    backgroundColor: COLORS.surface, padding: 16, borderRadius: 12, marginBottom: 12,
    borderLeftWidth: 4, borderLeftColor: COLORS.surfaceHighlight 
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  plateBadge: { backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  plateText: { color: '#000', fontWeight: 'bold', fontFamily: 'monospace' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { color: COLORS.textDim, fontSize: 12 }
});