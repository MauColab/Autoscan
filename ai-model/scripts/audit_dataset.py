import os

IMG_FOLDER = os.path.join("datasets", "yolo", "images")
LBL_FOLDER = os.path.join("datasets", "yolo", "labels")

def audit():
    print(f"AUDITANDO:\n IMÁGENES: {IMG_FOLDER}\n LABELS: {LBL_FOLDER}\n")

    images = os.listdir(IMG_FOLDER)
    missing = 0
    empty = 0

    for img in images:
        base = os.path.splitext(img)[0]
        lbl = os.path.join(LBL_FOLDER, f"{base}.txt")

        if not os.path.exists(lbl):
            print(f"[FALTA LABEL] {img}")
            missing += 1
        else:
            if os.path.getsize(lbl) == 0:
                print(f"[LABEL VACÍO] {base}.txt")
                empty += 1

    print(f"\n--- RESUMEN ---")
    print(f"Total imágenes: {len(images)}")
    print(f"Labels faltantes: {missing}")
    print(f"Labels vacíos: {empty}")

if __name__ == "__main__":
    audit()