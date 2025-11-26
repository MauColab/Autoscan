import cv2
from ultralytics import YOLO
import easyocr
import os

# 1. Inicializar modelos
# Carga tu modelo entrenado (ej. 'best.pt') o uno pre-entrenado
model = YOLO('modeloentrenado.pt') 

# Inicializar EasyOCR (puedes agregar 'es' si esperas texto en español)
reader = easyocr.Reader(['en'], gpu=False) # Pon gpu=False si no tienes CUDA

# 2. Cargar imagen
# Obtiene la ruta de la carpeta donde está tu script 'ocr.py'
current_dir = os.path.dirname(os.path.abspath(__file__))

# Une esa ruta con el nombre de tu imagen
img_path = os.path.join(current_dir, 'testimage.jpg')

print(f"Buscando imagen en: {img_path}") # Esto te ayudará a depurar
img = cv2.imread(img_path)

# 3. Realizar inferencia con YOLO
results = model(img)

crops = [] # Lista para almacenar recortes de placas

# 4. Procesar detecciones
for result in results:
    boxes = result.boxes
    for box in boxes:
        # Extraer coordenadas (x1, y1, x2, y2)
        x1, y1, x2, y2 = box.xyxy[0].int().tolist()
        
        # Confianza de la detección
        conf = box.conf[0]
        
        # Filtrar por confianza si es necesario (ej. > 50%)
        if conf >= 0.7:
            # --- PASO CLAVE: RECORTAR LA IMAGEN (ROI) ---
            # Nota: OpenCV usa img[y:y+h, x:x+w]
            plate_crop = img[y1:y2, x1:x2]

            # --- PRE-PROCESAMIENTO PARA OCR ---
            # Convertir recorte a escala de grises
            gray_plate = cv2.cvtColor(plate_crop, cv2.COLOR_BGR2GRAY)

            # Aplicar umbral (Otsu thresholding o adaptativo)
            _, binary_plate = cv2.threshold(gray_plate, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

            # Pasar la imagen procesada al lector
            ocr_result = reader.readtext(binary_plate)
            
            # Almacenar el recorte para visualización posterior
            crops.append(binary_plate)

            # --- PASO DE LECTURA CON EASYOCR ---
            # detail=0 devuelve solo el texto simple. 
            # Quita detail=0 si quieres coordenadas y confianza del texto
            # Solo permitir caracteres alfanuméricos
            ocr_result = reader.readtext(binary_plate, allowlist='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')
            
            # Mostrar resultados
            print(f"Placa detectada en [{x1}, {y1}, {x2}, {y2}]")
            
            for (bbox, text, prob) in ocr_result:
                print(f"Texto: {text} (Confianza: {prob:.2f})")
                
                # Opcional: Dibujar el texto en la imagen original
                cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(img, text, (x1, y1 - 10), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)

# 5. Mostrar imagen final
#cv2.imshow('Deteccion y OCR', crops[1] if crops else img)
cv2.imshow('Deteccion y OCR', img)
cv2.waitKey(0)
cv2.destroyAllWindows()