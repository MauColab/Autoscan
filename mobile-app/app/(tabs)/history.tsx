import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, CheckCircle, AlertTriangle, User, FileText, XCircle, Loader } from 'lucide-react-native';
import { COLORS, STYLES } from '@/constants/theme';
import { useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import React from 'react';

// REPLACE WITH YOUR PC IP
const API_URL = 'http://10.67.153.175:5000';

export default function HistoryScreen() {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchHistory();
    }, [])
  );

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/evaluations`);
      const data = await res.json();
      setHistoryData(data);
    } catch (e) {
      console.log("Error fetching history", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.background, '#0f172a']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Text style={styles.title}>Historial de Denuncias</Text>
        <Text style={styles.subtitle}>Seguimiento de casos enviados</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={historyData}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 50 }}>
              <Text style={{ color: COLORS.textDim }}>No hay denuncias registradas.</Text>
            </View>
          }
          renderItem={({ item }) => <HistoryCard item={item} />}
        />
      )}
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
        <Image source={{ uri: item.img_url || 'https://via.placeholder.com/150' }} style={styles.evidenceImg} />

        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <User size={14} color={COLORS.primary} />
            <Text style={styles.infoText} numberOfLines={1}>{item.sender || 'Usuario'}</Text>
          </View>

          <View style={styles.infoRow}>
            <FileText size={14} color={COLORS.textDim} />
            <Text style={styles.commentText} numberOfLines={2}>{item.summary || 'Sin comentarios'}</Text>
          </View>
        </View>
      </View>

      {/* Footer: Fecha */}
      <View style={styles.cardFooter}>
        <Clock size={12} color={COLORS.textDim} />
        <Text style={styles.dateText}>
          {item.created_at ? new Date(item.created_at).toLocaleString() : 'Reciente'}
        </Text>
      </View>
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  let color = COLORS.success;
  let text = "PROCESADO";
  let Icon = CheckCircle;
  let bg = "rgba(0, 255, 148, 0.1)";

  if (status === 'pending') {
    color = COLORS.primary;
    text = "EN REVISIÓN";
    Icon = Loader;
    bg = "rgba(0, 240, 255, 0.1)";
  }
  if (status === 'discarded') {
    color = COLORS.error;
    text = "DESCARTADO";
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