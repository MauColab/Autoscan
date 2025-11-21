from ultralytics import YOLO
import torch

def train_model():
    # 1. Cargar un modelo base
    model = YOLO('yolov8s.pt') 
    
    # 2. Especificar la data
    data_config = 'data.yaml'

    # 3. Iniciar el entrenamiento
    print("Iniciando entrenamiento...")
    model.train(
        data='data.yaml',
        epochs=100, 
        patience=20, 
        batch=4,
        workers=0,
        name='yolov8s_placas_peru_v2_augmented', # Nuevo nombre
        
        # --- AÑADE ESTAS LÍNEAS ---
        degrees=10,      # Rotación (en grados)
        translate=0.1,   # Traslación
        scale=0.1,       # Zoom
        hsv_h=0.015,     # Variación de Tono (color)
        hsv_s=0.7,       # Variación de Saturación
        hsv_v=0.4        # Variación de Brillo
    )
    print("Entrenamiento finalizado.")

if __name__ == '__main__':
    # Verificar si hay GPU disponible (CUDA)
    print(f"CUDA disponible: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"Nombre de GPU: {torch.cuda.get_device_name(0)}")
    
    # Ejecutar el entrenamiento
    train_model()