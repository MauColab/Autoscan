import logging
import os
import cv2
from paddleocr import PaddleOCR
import numpy as np
import re
import cv2
from ultralytics import YOLO

def extraerTexto(imagen, modelo_paddle, coordenadas_cajas=None):
    # Ejecutar predicción
    result = modelo_paddle.predict(imagen)

    # Inicializar listas para textos y scores
    textos = []
    scores = []
    
    # Iteramos sobre los resultados (generalmente 1 resultado por imagen procesada)
    for res in result:
        # Extraemos solo lo necesario para visualizar: Textos y Confianza.
        texto = res.get('rec_texts', [])   # El contenido del texto
        score = res.get('rec_scores', [])   # Nivel de confianza
        
        # Verificamos que las listas existan y no estén vacías
        if texto and score:
            # Usamos zip para unir el índice 0 de textos con el índice 0 de cajas, etc.
            for texto, score in zip(texto, score):
                textos.append(texto)
                scores.append(score)   # Útil para filtrar predicciones bajas (ej. < 0.5)

    return textos, scores

def extraerRecortes(imagen, modelo_yolo):
    """
    Retorna una lista (arreglo) de imágenes (numpy arrays).
    Cada elemento de la lista es un recorte de una placa detectada.
    """
    # Predicción
    results = modelo_yolo.predict(imagen, verbose=False)
    result = results[0]
    
    # Inicializamos el arreglo que contendrá las imágenes recortadas
    arreglo_placas = {
        "placas": [],
        "coordenadas": []
    }
    
    # Dimensiones originales para no salirse de los bordes
    h_img, w_img, _ = imagen.shape

    # Iteramos sobre CADA caja detectada (pueden ser varias)
    for box in result.boxes:
        # 1. Obtener coordenadas
        coords = box.xyxy[0].tolist()
        x1, y1, x2, y2 = map(int, coords)
        
        # 2. Asegurar que las coordenadas estén dentro de la imagen
        x1 = max(0, x1)
        y1 = max(0, y1)
        x2 = min(w_img, x2)
        y2 = min(h_img, y2)

        # 3. Recortar
        recorte = imagen[y1:y2, x1:x2]
        
        # 4. Agregar al arreglo si el recorte es válido
        if recorte.size > 0:            
            # Guardar coordenadas
            arreglo_placas["coordenadas"].append([[x1, y1], [x2, y1], [x2, y2], [x1, y2]])

            # Guardar recorte
            arreglo_placas["placas"].append(recorte)

    return arreglo_placas

def PreprocesarPlaca(plate_crop):
    # --- PRE-PROCESAMIENTO PARA OCR ---
    # Convertir recorte a escala de grises
    gray_plate = cv2.cvtColor(plate_crop, cv2.COLOR_BGR2GRAY)

    # Aplicar umbral (Otsu thresholding o adaptativo)
    _, binary_plate = cv2.threshold(gray_plate, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # Convertimos de nuevo a BGR para que tenga 3 canales (Shape: H, W, 3)
    # PaddleOCR necesita la dimensión del canal.
    binary_plate_3ch = cv2.cvtColor(binary_plate, cv2.COLOR_GRAY2BGR)
    
    return binary_plate_3ch 

def extraerPlaca(imagen_path):
    # ------- Cargar imagen -------
    # 1. Obtener ruta absoluta
    current_dir = os.path.dirname(os.path.abspath(__file__))
    img_path = os.path.join(current_dir, imagen_path)

    # 2. Cargar imagen
    img = cv2.imread(img_path)
    if img is None:
        print(f"Error: No se pudo cargar la imagen en {img_path}")
        return []

    # ------- Yolov8s -------
    modelo_yolo = YOLO('modeloentrenado.pt')
    placas = extraerRecortes(img, modelo_yolo)
    #print(placas)

    # ------- Preprocesar recortes y preparar para OCR -------
    placas["placas_procesadas"] = []
    for placa in placas["placas"]:
        # Aplicar preprocesamiento a cada recorte
        placa_procesada = PreprocesarPlaca(placa)
        placas["placas_procesadas"].append(placa_procesada)

    # ------- PaddleOCR -------
    # Silenciar mensajes de depuración
    #logging.getLogger("ppocr").setLevel(logging.WARNING)
    
    # Inicializar el modelo
    ocr = PaddleOCR(
        use_textline_orientation=True, 
        lang='en' 
    )
    placas["texto_predicho"] = []
    placas["confianza_predicho"] = []
    for placa_binaria in placas["placas_procesadas"]:     
        textos, scores = extraerTexto(placa_binaria, ocr)
        placas["texto_predicho"].append(textos)
        placas["confianza_predicho"].append(scores)
    print(placas)
    return placas

def visualizarResultados(imagen_path, datos_placas):
    """
    Dibuja los recuadros y el texto detectado sobre la imagen original.
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    img_path = os.path.join(current_dir, imagen_path)

    # Cargar imagen original
    img = cv2.imread(img_path)
    if img is None:
        print("No se pudo cargar la imagen para visualizar.")
        return

    # Iterar sobre cada placa detectada
    num_placas = len(datos_placas["coordenadas"])
    
    for i in range(num_placas):
        # 1. Obtener coordenadas y texto de la placa i
        puntos = datos_placas["coordenadas"][i]      # [[x1,y1], [x2,y1]...]
        lista_textos = datos_placas["texto_predicho"][i] # ['ABC-123', 'PERU']
        
        # Unir todos los textos detectados en esa placa (ej: "PERU ABC-123")
        if lista_textos:
            texto_etiqueta = " ".join(lista_textos)
        else:
            texto_etiqueta = "Desconocido"

        # 2. Dibujar el polígono (Caja de la placa)
        # Convertir lista de listas a numpy array int32 para cv2
        pts = np.array(puntos, np.int32)
        pts = pts.reshape((-1, 1, 2))
        
        # Dibujar contorno verde (BGR: 0, 255, 0), grosor 2
        cv2.polylines(img, [pts], isClosed=True, color=(0, 255, 0), thickness=2)

        # 3. Dibujar el Texto y un fondo para que se lea mejor
        # Coordenada superior izquierda para poner el texto
        x, y = puntos[0] 
        
        # Calcular tamaño del texto para hacer el fondo
        (w_text, h_text), _ = cv2.getTextSize(texto_etiqueta, cv2.FONT_HERSHEY_SIMPLEX, 0.8, 2)
        
        # Dibujar rectángulo relleno (fondo del texto)
        cv2.rectangle(img, (x, y - 30), (x + w_text, y), (0, 255, 0), -1)
        
        # Escribir el texto (en negro para contraste)
        cv2.putText(img, texto_etiqueta, (x, y - 5), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)

    # 4. Mostrar imagen final
    # Redimensionar si es muy grande para verla en pantalla
    h, w = img.shape[:2]
    if h > 800:
        factor = 800 / h
        img = cv2.resize(img, (int(w * factor), int(h * factor)))

    cv2.imshow("Resultados Deteccion Placas", img)
    print("Presiona cualquier tecla en la ventana de imagen para cerrar...")
    cv2.waitKey(0)
    cv2.destroyAllWindows()

if __name__ == "__main__":
    ruta = './imagenes_test/cbc3dc83-Foto-Placa-66-_jpg.rf.c93b5ce5d739ac126a02766b47f188c1.jpg'
    resultado_final = extraerPlaca(ruta)
    visualizarResultados(ruta, resultado_final)
