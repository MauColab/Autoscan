# Autoscan — Peruvian license-plate reading, from detector to field apps

A vehicle-inspection system built around a YOLOv8 detector trained on 2,620 Peruvian
license-plate photos. A Flask service crops the plate and runs OCR over it; an Electron
desktop app is the inspection station, and an Expo mobile app is the field client. Both
talk to the same HTTP API and share one Supabase schema of four tables.

**License:** dataset CC BY 4.0 (see [Data & provenance](#data--provenance))

## Repository layout

| Directory | What it is | Stack |
|---|---|---|
| `ai-model/` | Detector, OCR and the HTTP API everything else calls | Python, Ultralytics YOLOv8, PaddleOCR, Flask, Supabase |
| `pc-program/` | Inspection-station desktop app | Electron 39 |
| `mobile-app/` | Field client for inspectors | Expo 54, React Native 0.81, expo-router |
| `database_schema.sql` | Postgres/Supabase schema: `mobile_users`, `stations`, `evaluations`, `reports` | SQL |

## Results

**The detector has no committed evaluation.** `training/train_tp.py` calls
`model.val(split='test')`, but no metrics file, confusion matrix or `runs/` output is in
the repository, so there is no mAP or precision figure here that can be checked. What is
measured and reproducible is the dataset geometry, computed in
`ai-model/notebooks/ANÁLISIS GEOMÉTRICO.ipynb` directly from the annotation CSVs:

| Measure | Value | Why it matters |
|---|---|---|
| Boxes / images (train) | 4,144 over 2,433 | 1.70 plates per image — multi-object, not single-object |
| Median box size | 31 × 16 px | under the 32×32 COCO "small object" threshold |
| Median box area | 504 px² = **0.12%** of the frame | the target is tiny at 640×640, which drives `imgsz` |
| Median aspect ratio (w/h) | 1.92 | anchors need to be wide, not square |
| Boxes within 5 px of a border | 129 (3.1%) | truncated plates the model cannot fully see |
| Split | 2,433 / 128 / 53 images | 93% / 5% / 2% — see Limitations |

Training configuration actually in the repo: YOLOv8s, 50 epochs, `imgsz=640`, single class
`placa`, config in `ai-model/data_tp.yaml`.

Reproduce the table: open the notebook and run all cells.
Reproduce the model: `python ai-model/training/train_tp.py`.

## How it works

- **Detection and reading are two separate models.** YOLOv8 finds the plate, PaddleOCR
  reads the crop (`ai-model/core/plate_detector.py`). Cropping first means OCR sees a
  tight, high-contrast region instead of a whole vehicle scene — which matters a lot when
  the median plate is 0.12% of the frame.
- **Models are loaded once into a module-level cache** (`_YOLO_MODEL`, `_OCR_MODEL`) at
  API startup, not per request. Loading YOLO plus PaddleOCR per call would dominate
  response time.
- **The detector falls back to stock `yolov8n.pt`** when `modeloentrenado.pt` is absent,
  so the API still starts on a fresh checkout — it just detects worse. The warning it
  prints is the signal that you are running without the trained weights.
- **One API serves both clients.** The Electron station and the Expo app both hit the same
  Flask endpoints, with separate auth per client type (`/station/*` vs `/mobile/*`), so
  station and inspector accounts stay distinct while `/predict` and `/evaluations` are
  shared.
- **Persistence is Supabase, with an in-memory fallback.** If `SUPABASE_URL` / `SUPABASE_KEY`
  are unset the API keeps state in memory, which makes the whole stack runnable without
  provisioning a database.
- **Labels are generated, not hand-written.** `_annotations.csv` is the ground truth;
  `data_tools/convert_csv_to_yolo.py` derives every YOLO `.txt` from it. That is why the
  CSVs are the only dataset files kept in git.

## Quick start

The dataset is not in the repository. Download **Peru License Plate v7** from
[Roboflow Universe](https://universe.roboflow.com/billy-soplin/peru-license-plate)
in *TensorFlow Object Detection* format into `ai-model/datasets/raw/Dataset_TP/`, then
generate the YOLO labels:

```bash
cd ai-model
pip install -r requirements.txt
python data_tools/convert_csv_to_yolo.py     # _annotations.csv -> .txt
python training/train_tp.py                  # optional: retrain
```

API (loads the models at startup, so first boot is slow):

```bash
python ai-model/api/app.py                   # http://localhost:5000
```

| Method | Route | Purpose |
|---|---|---|
| GET | `/health` | Liveness |
| POST | `/predict` | Image in, plate text out |
| POST | `/station/register`, `/station/login` | Inspection-station accounts |
| POST | `/mobile/register`, `/mobile/login` | Inspector accounts |
| GET/POST | `/evaluations` | Vehicle evaluations |
| GET/POST | `/reports` | Inspection reports |

Desktop station and mobile client:

```bash
cd pc-program  && npm install && npm start    # Electron
cd mobile-app  && npm install && npx expo start
```

Database: run `database_schema.sql` against your Supabase project, then set
`SUPABASE_URL` and `SUPABASE_KEY` for the API.

## Data & provenance

Peru License Plate v7, exported from Roboflow Universe on 2025-09-29, **CC BY 4.0**,
2,620 images, one class (`placa`). Observed: the photographs and the human-drawn boxes in
`_annotations.csv`. Derived by Roboflow before export: EXIF-stripped auto-orientation,
stretch-resize to 640×640, and three augmented variants per source image
(horizontal/vertical flip at p=0.5, 0–20% crop, ±15° rotation, ±20% brightness). Derived
here: the YOLO `.txt` labels and everything in the geometry notebook.

Only the three `_annotations.csv` files are versioned. Images and weights are not — the
images are re-downloadable from Roboflow and the labels regenerate from the CSVs, so
keeping ~400 MB of binaries in git bought nothing.

## Limitations

- **No detector metrics are published.** Until a validation run is committed, any claim
  about accuracy is unverified. `model.val(split='test')` exists; its output does not.
- **The test split is 53 images / 88 boxes.** That is too small to separate two model
  variants — a handful of boxes moves any metric by more than a percentage point. The
  93/5/2 split is also heavily skewed toward training.
- **Training images are augmented copies of fewer real scenes.** Three variants per source
  photo means 2,433 training images are far fewer than 2,433 independent situations, and
  vertical flips put upside-down plates in the training distribution — something that never
  occurs in deployment.
- **Six training images carry no annotation rows.** Whether they are true negatives or
  missed labels is unresolved, and it changes the false-positive picture.
- **The trained weights are not in the repository.** `modeloentrenado.pt` was removed along
  with the dataset; without it the API silently falls back to stock `yolov8n.pt`, which was
  never trained on Peruvian plates. Publish the weights as a GitHub Release and download
  them into `ai-model/`.
- **Auth is minimal.** The API separates station and mobile accounts but has no rate
  limiting, and the in-memory fallback means a misconfigured deployment can accept
  registrations that vanish on restart.

## License

Dataset: CC BY 4.0, attributed to its Roboflow Universe author. Application code in this
repository is released under the same terms.
