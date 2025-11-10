from ultralytics import YOLO
import torch

def train_model():
    model = YOLO('yolov8s.pt') 

    data_config = 'data.yaml'

    print("Iniciando entrenamiento...")
    model.train(
        data=data_config,
        epochs=60,         
        imgsz=640,         
        batch=2,           
        name='yolov8s_placas_peru_v1',
        workers=0
    )
    print("Entrenamiento finalizado.")

if __name__ == '__main__':
    print(f"CUDA disponible: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"Nombre de GPU: {torch.cuda.get_device_name(0)}")
    
    train_model()