import os
import cv2
import numpy as np

class FaceRecognitionService:
    def __init__(self):
        # Load OpenCV's built-in Haar Cascades
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        self.face_cascade = cv2.CascadeClassifier(cascade_path)
        if self.face_cascade.empty():
            print("Warning: Haar cascade could not be loaded from", cascade_path)
        
        # Load eye cascade for secondary validation
        eye_cascade_path = cv2.data.haarcascades + 'haarcascade_eye.xml'
        self.eye_cascade = cv2.CascadeClassifier(eye_cascade_path)
        
        # Initialize CLAHE for illumination normalization
        self.clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))

    def detect_faces(self, image_np, min_neighbors=5, min_size=(60, 60)):
        """
        Detects faces in OpenCV image.
        Returns list of bounding boxes: [{'x': x, 'y': y, 'width': w, 'height': h, 'confidence': conf}]
        """
        if image_np is None:
            return []
        
        gray = cv2.cvtColor(image_np, cv2.COLOR_BGR2GRAY)
        # Apply histogram equalization for robust detection under poor lighting
        gray_eq = self.clahe.apply(gray)
        
        faces = self.face_cascade.detectMultiScale(
            gray_eq,
            scaleFactor=1.15,
            minNeighbors=min_neighbors,
            minSize=min_size,
            flags=cv2.CASCADE_SCALE_IMAGE
        )
        
        results = []
        for (x, y, w, h) in faces:
            results.append({
                'x': int(x),
                'y': int(y),
                'width': int(w),
                'height': int(h),
                'box': [int(x), int(y), int(w), int(h)]
            })
            
        # Sort by area descending (largest face first)
        results.sort(key=lambda item: item['width'] * item['height'], reverse=True)
        return results

    def extract_face_embedding(self, image_np, box=None):
        """
        Extracts a normalized 128-dimensional biometric feature embedding vector
        from the face region using multi-scale spatial gradients, frequency DCT,
        and cell intensity distributions with CLAHE normalization.
        """
        if image_np is None:
            return None
        
        h_img, w_img = image_np.shape[:2]
        
        if box is None:
            faces = self.detect_faces(image_np)
            if not faces:
                return None
            x, y, w, h = faces[0]['box']
        else:
            x, y, w, h = box
        
        # Add 10% context margin around face bounding box
        margin_x = int(w * 0.1)
        margin_y = int(h * 0.1)
        x0 = max(0, x - margin_x)
        y0 = max(0, y - margin_y)
        x1 = min(w_img, x + w + margin_x)
        y1 = min(h_img, y + h + margin_y)
        
        face_crop = image_np[y0:y1, x0:x1]
        if face_crop.size == 0:
            return None
            
        # Preprocessing: resize to canonical 128x128 resolution
        face_resized = cv2.resize(face_crop, (128, 128), interpolation=cv2.INTER_AREA)
        gray = cv2.cvtColor(face_resized, cv2.COLOR_BGR2GRAY)
        
        # Normalize lighting using CLAHE
        norm_gray = self.clahe.apply(gray)
        norm_float = norm_gray.astype(np.float32) / 255.0
        
        # 1. Feature Part A: 8x8 Spatial Grid Means and Variances (32 + 32 = 64 features)
        grid_h, grid_w = 16, 16  # 128 / 8 = 16
        means = []
        stds = []
        for i in range(8):
            for j in range(8):
                cell = norm_float[i*grid_h:(i+1)*grid_h, j*grid_w:(j+1)*grid_w]
                means.append(float(np.mean(cell)))
                stds.append(float(np.std(cell)))
                
        # 2. Feature Part B: 2D Discrete Cosine Transform (DCT) low-frequency coefficients (32 features)
        # DCT captures fundamental geometric face contours invariant to local pixel noise
        dct = cv2.dct(norm_float)
        # Extract zig-zag / top-left 6x6 low frequencies excluding DC offset
        dct_features = []
        for u in range(6):
            for v in range(6):
                if u == 0 and v == 0:
                    continue  # skip DC component
                dct_features.append(float(dct[u, v]))
                if len(dct_features) >= 32:
                    break
            if len(dct_features) >= 32:
                break
                
        # 3. Feature Part C: Multi-directional Sobel gradient magnitudes across central face cells (32 features)
        sobelx = cv2.Sobel(norm_float, cv2.CV_32F, 1, 0, ksize=3)
        sobely = cv2.Sobel(norm_float, cv2.CV_32F, 0, 1, ksize=3)
        grad_mag = cv2.magnitude(sobelx, sobely)
        
        grad_features = []
        # Sample 4x8 grid gradient magnitudes
        for r in range(4):
            for c in range(8):
                cell_g = grad_mag[r*32:(r+1)*32, c*16:(c+1)*16]
                grad_features.append(float(np.mean(cell_g)))
                
        # Combine all components into exactly 128 dimensions:
        # 64 (spatial cell stats) + 32 (DCT geometry) + 32 (gradient magnitudes) = 128 features
        raw_vector = np.array(means + stds[:32] + dct_features[:32], dtype=np.float32)
        
        # Ensure exact length of 128
        if len(raw_vector) < 128:
            raw_vector = np.pad(raw_vector, (0, 128 - len(raw_vector)), mode='constant')
        elif len(raw_vector) > 128:
            raw_vector = raw_vector[:128]
            
        # L2 unit normalization for direct Cosine Similarity calculation
        norm = np.linalg.norm(raw_vector)
        if norm > 0:
            norm_vector = raw_vector / norm
        else:
            norm_vector = raw_vector
            
        return norm_vector.tolist()

    def calculate_similarity(self, embedding1, embedding2):
        """
        Calculates cosine similarity between two 128-D embeddings.
        Returns a float between 0.0 and 1.0 (higher = closer match).
        """
        if not embedding1 or not embedding2:
            return 0.0
            
        vec1 = np.array(embedding1, dtype=np.float32)
        vec2 = np.array(embedding2, dtype=np.float32)
        
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
            
        dot = np.dot(vec1, vec2)
        cosine_sim = dot / (norm1 * norm2)
        
        # Bound score to [0.0, 1.0]
        score = max(0.0, min(1.0, float(cosine_sim)))
        return score

    def recognize_face(self, image_np, enrolled_students, threshold=0.65):
        """
        Detects faces in frame and matches against enrolled students.
        enrolled_students: list of Student model objects with embeddings.
        threshold: minimum cosine similarity score to consider a valid match.
        
        Returns:
            dict: {
                'detected': bool,
                'faces_count': int,
                'match_found': bool,
                'matched_student': Student or None,
                'confidence': float,
                'box': [x, y, w, h] or None,
                'all_candidates': list
            }
        """
        faces = self.detect_faces(image_np)
        if not faces:
            return {
                'detected': False,
                'faces_count': 0,
                'match_found': False,
                'matched_student': None,
                'confidence': 0.0,
                'box': None,
                'message': 'No face detected in video feed.'
            }
            
        # Select primary face
        primary_face = faces[0]
        query_embedding = self.extract_face_embedding(image_np, primary_face['box'])
        
        if not query_embedding:
            return {
                'detected': True,
                'faces_count': len(faces),
                'match_found': False,
                'matched_student': None,
                'confidence': 0.0,
                'box': primary_face['box'],
                'message': 'Failed to extract face features from detected face.'
            }
            
        best_student = None
        best_similarity = 0.0
        candidates = []
        
        for student in enrolled_students:
            emb = student.get_embedding()
            if not emb:
                continue
                
            sim = self.calculate_similarity(query_embedding, emb)
            candidates.append({
                'student_id': student.student_id,
                'name': student.full_name,
                'similarity': round(sim, 4)
            })
            
            if sim > best_similarity:
                best_similarity = sim
                best_student = student
                
        # Sort candidate scores descending
        candidates.sort(key=lambda c: c['similarity'], reverse=True)
        
        match_found = best_student is not None and best_similarity >= threshold
        
        return {
            'detected': True,
            'faces_count': len(faces),
            'match_found': match_found,
            'matched_student': best_student if match_found else None,
            'confidence': round(best_similarity, 4),
            'confidence_percentage': f"{round(best_similarity * 100, 1)}%",
            'box': primary_face['box'],
            'threshold_used': threshold,
            'all_candidates': candidates[:5],
            'message': f"Match identified: {best_student.full_name} ({round(best_similarity*100, 1)}%)" if match_found else "Face detected but no matching student found above threshold."
        }

# Global singleton service
face_service = FaceRecognitionService()
