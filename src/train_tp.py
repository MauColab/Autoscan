from ultralytics import YOLO
import os

def train_massive_dataset():
    # 1. Cargar modelo (puedes usar tu best.pt anterior para seguir entrenando o empezar de cero)
    # Si quieres aprovechar lo que ya aprendió, usa la ruta de tu best.pt anterior.
    # Si quieres empezar limpio con la data masiva, usa 'yolov8s.pt'
    model = YOLO('yolov8s.pt') 

    # 2. Entrenar con el nuevo dataset masivo
    print("--- INICIANDO ENTRENAMIENTO MASIVO (2400+ IMÁGENES) ---")
    results = model.train(
        data='data_tp.yaml', # ¡Apunta al nuevo yaml!
        epochs=50,           # Con tantos datos, 50 épocas pueden ser suficientes
        patience=10,         # Early stopping
        imgsz=640,
        batch=12,             # Mantén 4 por tu GPU 3050
        workers=0,
        name='yolov8s_tp_massive',
        
        # Aumentación (Data Augmentation)
        degrees=10,
        hsv_v=0.4,
        translate=0.1,
        scale=0.5,           # Un poco más de escala para variedad
        mosaic=1.0           # Mosaico activado (muy bueno para datasets grandes)
    )

    # 3. Imprimir Métricas Finales
    print("\n--- RESULTADOS DEL ENTRENAMIENTO ---")
    # results.box.map50 es el mAP50
    print(f"mAP50 Final: {results.box.map50:.4f}")
    print(f"mAP50-95 Final: {results.box.map:.4f}")
    
    # 4. Información del Modelo Guardado
    save_path = os.path.join(results.save_dir, 'weights', 'best.pt')
    print(f"\n[IMPORTANTE] Tu mejor modelo está guardado en:")
    print(f" -> {save_path}")
    print("\nNOTA: YOLO usa la extensión .pt por defecto. Es compatible con PyTorch.")
    print("Si necesitas renombrarlo a .pth, puedes hacerlo manualmente, pero .pt es lo recomendado.")

    # 5. Validación final con el set de TEST (las 53 fotos)
    print("\n--- VALIDACIÓN CON DATASET DE TEST (53 FOTOS) ---")
    metrics = model.val(split='test')
    print(f"Test mAP50: {metrics.box.map50:.4f}")
    print(f"Test Precision: {metrics.box.p.mean():.4f}")
    print(f"Test Recall: {metrics.box.r.mean():.4f}")

if __name__ == '__main__':
    train_massive_dataset()