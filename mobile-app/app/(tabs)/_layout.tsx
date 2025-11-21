import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { HapticTab } from '@/components/haptic-tab';
import { COLORS, STYLES } from '@/constants/theme';
import { House, Clock, User } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textDim,
        tabBarShowLabel: false,
        tabBarButton: HapticTab,
        // Estilo Flotante (Cyberpunk Glass)
        tabBarStyle: {
          position: 'absolute',
          bottom: 25,
          left: 20,
          right: 20,
          // CORRECCIÓN 1: Usamos STYLES.glass para el color de fondo en Android
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : STYLES.glass.backgroundColor,
          borderRadius: 25,
          height: 70,
          borderTopWidth: 0,
          borderWidth: 1,
          // CORRECCIÓN 2: Usamos STYLES.glass para el borde
          borderColor: STYLES.glass.borderColor,
          shadowColor: COLORS.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
          // CORRECCIÓN 3: Eliminé el duplicado, dejamos solo una elevation
          elevation: 10, 
          paddingBottom: 0,
        },
        // Blur solo en iOS
        tabBarBackground: () => (
           Platform.OS === 'ios' ? 
            <BlurView intensity={80} style={{ flex: 1, borderRadius: 25, overflow: 'hidden' }} tint="dark" /> 
            : null
        ),
      }}>
      
      {/* 1. Dashboard */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <House size={28} color={color} />,
        }}
      />

      {/* 2. Historial */}
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historial',
          tabBarIcon: ({ color }) => <Clock size={28} color={color} />,
        }}
      />

      {/* 3. Perfil */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <User size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}