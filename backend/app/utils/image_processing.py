import base64
import os
import uuid
import cv2
import numpy as np
from PIL import Image
import io

def decode_base64_image(base64_str):
    """Decodes base64 string to OpenCV BGR numpy array."""
    try:
        if not base64_str:
            return None
        if ',' in base64_str:
            base64_str = base64_str.split(',', 1)[1]
        img_data = base64.b64decode(base64_str)
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        print(f"Error decoding base64 image: {e}")
        return None

def encode_image_to_base64(img_np, ext='.jpg'):
    """Encodes OpenCV BGR numpy array to base64 string with data URI prefix."""
    try:
        _, buffer = cv2.imencode(ext, img_np)
        b64_str = base64.b64encode(buffer).decode('utf-8')
        mime = 'image/jpeg' if ext in ['.jpg', '.jpeg'] else 'image/png'
        return f"data:{mime};base64,{b64_str}"
    except Exception as e:
        print(f"Error encoding image to base64: {e}")
        return None

def save_student_photo(img_np, student_id, upload_folder):
    """Saves student image to disk and returns relative web path."""
    try:
        os.makedirs(upload_folder, exist_ok=True)
        filename = f"{student_id}_{uuid.uuid4().hex[:8]}.jpg"
        filepath = os.path.join(upload_folder, filename)
        
        # Resize to standard profile dimension max 600px width/height while keeping aspect ratio
        h, w = img_np.shape[:2]
        max_dim = 600
        if max(h, w) > max_dim:
            scale = max_dim / max(h, w)
            new_w, new_h = int(w * scale), int(h * scale)
            resized = cv2.resize(img_np, (new_w, new_h), interpolation=cv2.INTER_AREA)
        else:
            resized = img_np
            
        cv2.imwrite(filepath, resized, [int(cv2.IMWRITE_JPEG_QUALITY), 92])
        return f"/uploads/students/{filename}"
    except Exception as e:
        print(f"Error saving student photo: {e}")
        return None
