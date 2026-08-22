import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, ActivityIndicator, Alert, TextInput, ScrollView, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { X, Camera, Image as ImageIcon, UploadCloud, RefreshCw, CheckCircle, AlertTriangle, CheckSquare, Square } from 'lucide-react-native';
import { COLORS, STYLES } from '@/constants/theme';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { useState, useRef, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';

// REPLACE THIS WITH YOUR PC'S IP ADDRESS
const API_URL = 'http://10.67.153.175:5000'; 

export default function ScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // Multiple Plate Logic
  const [detectedPlates, setDetectedPlates] = useState<string[]>([]);
  const [selectedPlates, setSelectedPlates] = useState<string[]>([]);
  const [showSelection, setShowSelection] = useState(false);
  const [plateQueue, setPlateQueue] = useState<string[]>([]);
  const [currentPlateIndex, setCurrentPlateIndex] = useState(0);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    plate: '',
    model: '',
    location: '',
    owner: '',
    sender: 'Oficial Móvil',
    dni: '45879632', // Mock DNI
    img: ''
  });

  useEffect(() => {
    // Request permission on mount if not determined
    if (permission && !permission.granted && permission.canAskAgain) {
        requestPermission();
    }
  }, [permission]);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ textAlign: 'center', color: COLORS.text, marginBottom: 20, fontSize: 16 }}>
          Necesitamos acceso a la cámara para escanear placas.
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.btnPrimary}>
          <Text style={styles.btnText}>Conceder Permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  async function handleImage(uri: string) {
    setLoading(true);
    try {
      const form = new FormData();
      // @ts-ignore
      form.append('file', {
        uri: uri,
        type: 'image/jpeg',
        name: 'upload.jpg',
      });

      const response = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: form,
      });

      const data = await response.json();
      setLoading(false);

      if (data.status === 'success') {
        const plates = data.plates_found || [];
        
        if (plates.length > 0) {
            // Save image URI for submission
            setFormData(prev => ({ ...prev, img: uri }));
            
            if (plates.length > 1) {
                // Multiple plates found
                setDetectedPlates(plates);
                setSelectedPlates(plates); // Select all by default
                setShowSelection(true);
            } else {
                // Single plate
                startQueue([plates[0]]);
            }
        } else {
            Alert.alert("Aviso", "No se detectaron placas en la imagen.");
        }
      } else {
        Alert.alert("Error", data.error || "Error desconocido del servidor");
      }

    } catch (error) {
      setLoading(false);
      Alert.alert("Error de Conexión", "No se pudo conectar con el servidor AI. Verifique la IP.");
      console.error(error);
    }
  }

  function toggleSelection(plate: string) {
      if (selectedPlates.includes(plate)) {
          setSelectedPlates(selectedPlates.filter(p => p !== plate));
      } else {
          setSelectedPlates([...selectedPlates, plate]);
      }
  }

  function confirmSelection() {
      if (selectedPlates.length === 0) {
          Alert.alert("Aviso", "Seleccione al menos una placa.");
          return;
      }
      setShowSelection(false);
      startQueue(selectedPlates);
  }

  function startQueue(plates: string[]) {
      setPlateQueue(plates);
      setCurrentPlateIndex(0);
      openFormForPlate(plates[0]);
  }

  function openFormForPlate(plate: string) {
      setFormData(prev => ({
          ...prev,
          plate: plate,
          model: '',
          location: '',
          owner: ''
      }));
      setShowForm(true);
  }

  async function submitReport() {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/evaluations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      setLoading(false);
      
      if (data.status === 'success') {
        // Check if more plates
        const nextIndex = currentPlateIndex + 1;
        if (nextIndex < plateQueue.length) {
            setCurrentPlateIndex(nextIndex);
            openFormForPlate(plateQueue[nextIndex]);
        } else {
            setShowForm(false);
            Alert.alert("Reporte Enviado", "Todos los reportes han sido enviados a la central.");
            router.back();
        }
      } else {
        Alert.alert("Error", "No se pudo enviar el reporte.");
      }
    } catch (error) {
      setLoading(false);
      Alert.alert("Error", "Fallo al enviar reporte.");
    }
  }

  async function takePicture() {
    if (cameraRef.current) {
      try {
          const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
          if (photo) {
            setIsCameraOpen(false);
            handleImage(photo.uri);
          }
      } catch (e) {
          console.error("Error taking picture:", e);
          Alert.alert("Error", "No se pudo capturar la foto.");
      }
    }
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      handleImage(result.assets[0].uri);
    }
  }

  if (isCameraOpen) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView 
            ref={cameraRef} 
            style={styles.camera} 
            facing={facing}
            onMountError={(e) => Alert.alert("Error de Cámara", "No se pudo iniciar la cámara: " + e.message)}
        >
          <View style={styles.cameraControls}>
            <TouchableOpacity style={styles.cameraBtn} onPress={() => setIsCameraOpen(false)}>
              <X color="#fff" size={24} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
              <View style={styles.captureInner} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.cameraBtn} onPress={toggleCameraFacing}>
              <RefreshCw color="#fff" size={24} />
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Loading Overlay */}
      {loading && (
        <Modal transparent animationType="fade">
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Procesando...</Text>
          </View>
        </Modal>
      )}

      {/* Selection Modal */}
      <Modal visible={showSelection} animationType="slide" transparent>
        <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Placas Detectadas</Text>
                <Text style={styles.label}>Seleccione las placas a reportar:</Text>
                
                <FlatList 
                    data={detectedPlates}
                    keyExtractor={item => item}
                    renderItem={({item}) => (
                        <TouchableOpacity style={styles.checkboxRow} onPress={() => toggleSelection(item)}>
                            {selectedPlates.includes(item) ? 
                                <CheckSquare color={COLORS.primary} size={24} /> : 
                                <Square color={COLORS.textDim} size={24} />
                            }
                            <Text style={styles.checkboxText}>{item}</Text>
                        </TouchableOpacity>
                    )}
                    style={{ maxHeight: 200, marginVertical: 10 }}
                />

                <View style={styles.modalButtons}>
                    <TouchableOpacity onPress={() => setShowSelection(false)} style={styles.cancelBtn}>
                        <Text style={styles.cancelBtnText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={confirmSelection} style={styles.confirmBtn}>
                        <Text style={styles.confirmBtnText}>Continuar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

      {/* Report Form Modal */}
      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                  Reporte {currentPlateIndex + 1} de {plateQueue.length}
              </Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <X color={COLORS.text} size={24} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.formScroll}>
              <Text style={styles.label}>Placa Detectada (Editable)</Text>
              <TextInput 
                style={[styles.input, { fontWeight: 'bold', color: COLORS.primary }]} 
                value={formData.plate}
                onChangeText={t => setFormData({...formData, plate: t})}
                placeholder="ABC-123"
                placeholderTextColor={COLORS.textDim}
              />

              <Text style={styles.label}>Modelo (Opcional)</Text>
              <TextInput 
                style={styles.input} 
                value={formData.model}
                onChangeText={t => setFormData({...formData, model: t})}
                placeholder="Ej. Toyota Yaris"
                placeholderTextColor={COLORS.textDim}
              />

              <Text style={styles.label}>Ubicación</Text>
              <TextInput 
                style={styles.input} 
                value={formData.location}
                onChangeText={t => setFormData({...formData, location: t})}
                placeholder="Ej. Av. Arequipa 123"
                placeholderTextColor={COLORS.textDim}
              />

              <Text style={styles.label}>Propietario (Opcional)</Text>
              <TextInput 
                style={styles.input} 
                value={formData.owner}
                onChangeText={t => setFormData({...formData, owner: t})}
                placeholder="Nombre del conductor"
                placeholderTextColor={COLORS.textDim}
              />
              
              <View style={styles.infoBox}>
                <AlertTriangle size={20} color={COLORS.primary} />
                <Text style={styles.infoText}>
                  Este reporte será enviado a la central con estado "En Revisión".
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.submitBtn} onPress={submitReport}>
              <Text style={styles.submitBtnText}>
                  {currentPlateIndex < plateQueue.length - 1 ? "SIGUIENTE PLACA" : "ENVIAR REPORTE"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
        <X color="#fff" size={24} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <UploadCloud size={60} color={COLORS.primary} />
        </View>

        <Text style={styles.title}>Análisis de Placa</Text>
        <Text style={styles.subtitle}>
          Seleccione el método de entrada.{'\n'}El sistema de IA procesará la imagen automáticamente.
        </Text>

        <View style={styles.actions}>
          <ActionButton
            icon={<Camera size={32} color="#000" />}
            title="Tomar Foto"
            desc="Usar cámara del dispositivo"
            primary
            onPress={() => setIsCameraOpen(true)}
          />

          <ActionButton
            icon={<ImageIcon size={32} color={COLORS.text} />}
            title="Galería"
            desc="Subir imagen existente"
            onPress={pickImage}
          />
        </View>
      </View>

      <Text style={styles.footerText}>VisionGuard Enterprise v2.4.0</Text>
    </View>
  );
}

function ActionButton({ icon, title, desc, primary, onPress }: any) {
  return (
    <TouchableOpacity
      style={[
        styles.actionButton,
        primary ? { backgroundColor: COLORS.primary } : { backgroundColor: COLORS.surface, borderColor: COLORS.surfaceHighlight, borderWidth: 1 }
      ]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={styles.actionContent}>
        {icon}
        <View>
          <Text style={[styles.actionTitle, { color: primary ? '#000' : COLORS.text }]}>{title}</Text>
          <Text style={[styles.actionDesc, { color: primary ? 'rgba(0,0,0,0.6)' : COLORS.textDim }]}>{desc}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 24 },
  closeBtn: { marginTop: 40, alignSelf: 'flex-end', padding: 8, backgroundColor: COLORS.surfaceHighlight, borderRadius: 20 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  iconContainer: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.primary,
    marginBottom: 30, ...STYLES.shadow
  },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text, marginBottom: 10 },
  subtitle: { textAlign: 'center', color: COLORS.textDim, marginBottom: 50, lineHeight: 22 },
  actions: { width: '100%', gap: 16 },
  actionButton: { padding: 20, borderRadius: 16, height: 90, justifyContent: 'center' },
  actionContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  actionTitle: { fontSize: 18, fontWeight: 'bold' },
  actionDesc: { fontSize: 13 },
  footerText: { textAlign: 'center', color: COLORS.surfaceHighlight, marginBottom: 20 },

  // Camera Styles
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  cameraControls: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    marginBottom: 40
  },
  cameraBtn: { padding: 15, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 50 },
  captureBtn: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center', alignItems: 'center'
  },
  captureInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' },
  btnPrimary: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 10, marginTop: 20 },
  btnText: { color: '#000', fontWeight: 'bold' },
  
  // Loading
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    color: COLORS.primary,
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold'
  },

  // Modal Form
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.surfaceHighlight,
    maxHeight: '80%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text
  },
  formScroll: {
    marginBottom: 20
  },
  label: {
    color: COLORS.textDim,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 5
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.surfaceHighlight,
    borderRadius: 10,
    padding: 15,
    color: COLORS.text,
    marginBottom: 15
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    padding: 15,
    borderRadius: 10,
    gap: 10,
    alignItems: 'center'
  },
  infoText: {
    color: COLORS.text,
    fontSize: 12,
    flex: 1
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center'
  },
  submitBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16
  },

  // Selection Modal
  checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.surfaceHighlight
  },
  checkboxText: {
      color: COLORS.text,
      fontSize: 16,
      fontFamily: 'monospace',
      fontWeight: 'bold'
  },
  modalButtons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 10,
      marginTop: 20
  },
  cancelBtn: {
      padding: 10
  },
  cancelBtnText: {
      color: COLORS.textDim,
      fontWeight: 'bold'
  },
  confirmBtn: {
      backgroundColor: COLORS.primary,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8
  },
  confirmBtnText: {
      color: '#000',
      fontWeight: 'bold'
  }
});