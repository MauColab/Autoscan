import logging
import os
import cv2
from paddleocr import PaddleOCR
import numpy as np
import re
import cv2
from ultralytics import YOLO

def extraerTexto(imagen, modelo_paddle):
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
                if score >= 0.5 and texto != "PERU":  # Filtrar por confianza mínima
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
    
    # Arreglo para guardar recortes
    recortes = []
    
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
            recortes.append(recorte)

    return recortes


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

    # ------- PaddleOCR -------
    # Silenciar mensajes de depuración
    logging.getLogger("ppocr").setLevel(logging.WARNING)
    
    # Inicializar el modelo
    ocr = PaddleOCR(
         text_detection_model_name="PP-OCRv5_server_det",
         text_recognition_model_name="en_PP-OCRv5_mobile_rec",
         use_doc_orientation_classify=False,
         use_doc_unwarping=True,
         use_textline_orientation=True,
    ) # Switch to PP-OCRv5_mobile models


    resultados = []
    for placa in placas:     
        textos, scores = extraerTexto(placa, ocr)
        resultados.append({
            "texto_predicho": textos,
            "confianza_predicho": scores
        })

    return resultados

if __name__ == "__main__":
    #Input: Ruta de la imagen a procesar
    ruta = "./imagenes_test/testimage.jpg"  # Cambia esto por la ruta de tu imagen de prueba
    resultado_final = extraerPlaca(ruta)

    print("Resultado Final:", resultado_final)
