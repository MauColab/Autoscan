import os
import cv2
import numpy as np


def find_file_in_dirs(filename, dirs):
    # Try direct join first
    for d in dirs:
        candidate = os.path.join(d, filename)
        if os.path.isfile(candidate):
            return candidate
    # If not found, walk each dir
    for d in dirs:
        for root, _, files in os.walk(d):
            if filename in files:
                return os.path.join(root, filename)
    return None


def apply_adaptive_binary(input_path, output_path, block_size=11, C=2):
    img = cv2.imread(input_path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise RuntimeError(f"Could not read image: {input_path}")
    # optional blur to reduce noise
    blurred = cv2.GaussianBlur(img, (5, 5), 0)
    thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                   cv2.THRESH_BINARY, block_size, C)
    ok = cv2.imwrite(output_path, thresh)
    if not ok:
        raise RuntimeError(f"Could not write output: {output_path}")

def apply_watershed(input_path, output_path):
    img = cv2.imread(input_path)
    if img is None:
        raise RuntimeError(f"Could not read image: {input_path}")
    
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    ret, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    # Noise removal
    kernel = np.ones((3, 3), np.uint8)
    opening = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=2)

    # Sure background area
    sure_bg = cv2.dilate(opening, kernel, iterations=3)

    # Sure foreground area
    dist_transform = cv2.distanceTransform(opening, cv2.DIST_L2, 5)
    ret, sure_fg = cv2.threshold(dist_transform, 0.7 * dist_transform.max(), 255, 0)

    # Unknown region
    sure_fg = np.uint8(sure_fg)
    unknown = cv2.subtract(sure_bg, sure_fg)

    # Marker labeling
    ret, markers = cv2.connectedComponents(sure_fg)
    markers = markers + 1
    markers[unknown == 255] = 0

    # Apply watershed
    markers = cv2.watershed(img, markers)
    img[markers == -1] = [0, 0, 255]  # Mark boundaries in red

    ok = cv2.imwrite(output_path, img)
    if not ok:
        raise RuntimeError(f"Could not write watershed output: {output_path}")

def main():
    # Filenames solicitadas
    filenames = [
        '1430557_jpg.rf.e9d9dedcd3bc62fb1a3dbf1147212dab.jpg',
        '20231009_192919_jpg.rf.f60f4c3de0cdbcdf865bdff509356d56.jpg',
        '20231009_192839_jpg.rf.6be4b3be3cf841171794dbeddfdbf064.jpg',
        '20231009_195128_jpg.rf.f37a771cbea56d8d931656936f578431.jpg',
        '20231009_194806_jpg.rf.b7ebe19ee13e432981eff75e50fd2607.jpg',
    ]

    # project root is parent of scripts/
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    dataset_dirs = [
        os.path.join(project_root, 'Dataset_TP', 'train'),
        os.path.join(project_root, 'Dataset_TP', 'ecualizadas'),
        os.path.join(project_root, 'Dataset_TP', 'valid'),
        os.path.join(project_root, 'Dataset_TP', 'test'),
    ]

    out_dir = os.path.join(project_root, 'Dataset_TP', 'train', 'adaptive_binary')
    os.makedirs(out_dir, exist_ok=True)

    processed = []
    missing = []

    for fn in filenames:
        src = find_file_in_dirs(fn, dataset_dirs)
        if src is None:
            print(f'[WARN] Not found: {fn}')
            missing.append(fn)
            continue
        out_name = os.path.splitext(fn)[0] + '_adaptive.png'
        out_path = os.path.join(out_dir, out_name)
        try:
            apply_adaptive_binary(src, out_path)
            print(f'[OK] Saved: {out_path} (from {src})')
            processed.append(out_path)

            watershed_name = os.path.splitext(fn)[0] + '_watershed.png'
            watershed_path = os.path.join(out_dir, watershed_name)
            apply_watershed(out_path, watershed_path)
            print(f'[OK] Watershed saved: {watershed_path}')
        except Exception as e:
            print(f'[ERROR] Processing {src}: {e}')

    print('\nSummary:')
    print(f'  Processed: {len(processed)}')
    for p in processed:
        print(f'    - {p}')
    if missing:
        print(f'  Missing: {len(missing)}')
        for m in missing:
            print(f'    - {m}')


if __name__ == '__main__':
    main()
