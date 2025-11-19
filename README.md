# Autoscan

Sistema de detección y reconocimiento de placas de vehículos peruanas utilizando modelos de aprendizaje profundo. Este proyecto combina detección de objetos con YOLO (You Only Look Once) y reconocimiento óptico de caracteres (OCR) para identificar y leer placas de matrícula en imágenes.

## Características

- **Detección de Placas**: Utiliza modelos YOLOv8/YOLO11 entrenados para detectar placas de vehículos en imágenes.
- **Reconocimiento OCR**: Emplea EasyOCR para extraer el texto de las placas detectadas.
- **Preprocesamiento**: Incluye utilidades para mejorar la calidad de las imágenes de placas antes del OCR.
- **Entrenamiento**: Scripts para entrenar modelos personalizados con datasets de placas peruanas.
- **Auditoría de Dataset**: Herramientas para verificar la integridad del dataset de entrenamiento.
- **Análisis Geométrico**: Notebooks para analizar las características geométricas del dataset.

## Instalación

### Prerrequisitos

- Python 3.8 o superior
- pip (gestor de paquetes de Python)

### Pasos de Instalación

1. **Clonar el repositorio**:
   ```bash
   git clone <url-del-repositorio>
   cd Autoscan
   ```

2. **Crear entorno virtual**:
   ```bash
   python -m venv venv
   ```

3. **Activar el entorno virtual**:
   - En Windows:
     ```bash
     venv\Scripts\activate
     ```
   - En Linux/Mac:
     ```bash
     source venv/bin/activate
     ```

4. **Instalar dependencias**:
   ```bash
   pip install -r requirements.txt
   ```

   **Nota**: El archivo `requirements.txt` incluye las dependencias básicas. Para funcionalidades completas, también necesitarás instalar:
   - `ultralytics` (para YOLO)
   - `easyocr` (para OCR)
   - `torch` (para entrenamiento)

   Instálalos manualmente si no están incluidos:
   ```bash
   pip install ultralytics easyocr torch
   ```

## Uso

### Detección de Placas

Ejecuta la detección en una imagen de prueba:

```bash
python core/detect.py
```

Este script:
- Carga el modelo YOLO desde `models/best.pt`
- Procesa la imagen `examples/testimage.jpg`
- Dibuja bounding boxes alrededor de las placas detectadas con confianza > 0.5
- Muestra la imagen resultante

### Reconocimiento OCR

Para detección y reconocimiento completo:

```bash
python core/ocr.py
```

Este script:
- Detecta placas usando YOLO
- Aplica preprocesamiento a las regiones detectadas
- Extrae texto usando EasyOCR
- Muestra la imagen con texto reconocido superpuesto

### Entrenamiento de Modelo

Para entrenar un modelo personalizado:

```bash
python core/Train.py
```

Este script entrena un modelo YOLOv8s con:
- Dataset definido en `data.yaml`
- 100 épocas con paciencia de 20
- Aumentaciones de datos (rotación, traslación, escala, variaciones HSV)
- Batch size de 4

## Estructura del Proyecto

```
Autoscan/
├── core/                    # Código principal
│   ├── detect.py           # Script de detección de placas
│   ├── ocr.py             # Script de detección + OCR
│   ├── Train.py           # Script de entrenamiento
│   └── utils/
│       └── preprocessing.py # Utilidades de preprocesamiento
├── datasets/               # Datasets
│   ├── backups/           # Backup del dataset original
│   ├── raw/              # Datos crudos
│   └── yolo/             # Dataset en formato YOLO
│       ├── images/       # Imágenes
│       └── labels/       # Etiquetas
├── examples/              # Imágenes de ejemplo
│   └── testimage.jpg
├── models/                # Modelos entrenados
│   ├── best.pt           # Mejor modelo entrenado
│   ├── yolo11n.pt       # Modelo YOLO11n base
│   └── yolov8s.pt       # Modelo YOLOv8s base
├── notebooks/             # Notebooks de análisis
│   └── ANÁLISIS GEOMÉTRICO.ipynb
├── scripts/               # Scripts utilitarios
│   ├── audit_dataset.py  # Auditoría del dataset
│   └── convert_dataset.py # Conversión de dataset
├── data.yaml             # Configuración del dataset YOLO
├── requirements.txt      # Dependencias Python
└── README.md            # Este archivo
```

## Dataset

El proyecto utiliza un dataset de placas de vehículos peruanas en formato YOLO:

- **Imágenes**: Almacenadas en `datasets/yolo/images/`
- **Etiquetas**: Archivos .txt con coordenadas YOLO en `datasets/yolo/labels/`
- **Configuración**: Definida en `data.yaml`

### Auditoría del Dataset

Para verificar la integridad del dataset:

```bash
python scripts/audit_dataset.py
```

Este script verifica:
- Que todas las imágenes tengan etiquetas correspondientes
- Que las etiquetas no estén vacías

## Scripts Utilitarios

### Conversión de Dataset

```bash
python scripts/convert_dataset.py
```

Convierte datasets de otros formatos al formato YOLO requerido.

## Notebooks

### Análisis Geométrico

`notebooks/ANÁLISIS GEOMÉTRICO.ipynb` contiene análisis del dataset incluyendo:

- Distribución de tamaños de bounding boxes
- Estadísticas de área de placas
- Selección de imágenes representativas
- Visualización de imágenes de ejemplo

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## Notas Adicionales

- Asegúrate de tener una GPU disponible para entrenamiento eficiente
- Los modelos pre-entrenados están optimizados para placas peruanas
- Para mejores resultados, usa imágenes de alta resolución con buena iluminación
