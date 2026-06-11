import fitz
import io
from PIL import Image

class ImageEngine:
    def process_operation(self, doc, operation, image_bytes):
        """
        Applies a single image injection operation to the PDF document.
        """
        pages_spec = operation.get('pages', 'all')
        pos_type = operation.get('position', 'center')
        custom_x = operation.get('custom_x', 0)
        custom_y = operation.get('custom_y', 0)
        scale = operation.get('scale', 1.0)
        opacity = operation.get('opacity', 1.0)
        
        # Load image once to get dimensions
        img = Image.open(io.BytesIO(image_bytes))
        img_width, img_height = img.size
        
        target_pages = self._get_target_pages(doc, pages_spec)
        
        for pno in target_pages:
            page = doc[pno]
            page_rect = page.rect
            pw, ph = page_rect.width, page_rect.height
            
            # Calculate rect for the image
            # Basic calculation: 1 image pixel = 1 PDF point at scale 1.0
            # (This can be refined if we want to match exact editor pixels)
            w = img_width * scale
            h = img_height * scale
            
            x, y = self._calculate_coordinates(pw, ph, w, h, pos_type, custom_x, custom_y)
            
            rect = fitz.Rect(x, y, x + w, y + h)
            
            page.insert_image(rect, stream=image_bytes, overlay=True)
            
            # Opacity is tricky in PyMuPDF for images directly. 
            # Usually requires layers or transparency groups if not natively supported in insert_image.
            # Simplified for Phase 1: Full opacity.
            
        return doc

    def _get_target_pages(self, doc, spec):
        num_pages = len(doc)
        if spec == 'all':
            return range(num_pages)
        if spec == 'first':
            return [0]
        if spec == 'last':
            return [num_pages - 1]
        
        # Handle ranges like '1-3' or '1,3,5'
        try:
            if ',' in spec:
                return [int(p.strip()) - 1 for p in spec.split(',') if p.strip().isdigit()]
            if '-' in spec:
                start, end = map(int, spec.split('-'))
                return range(start - 1, min(end, num_pages))
            if spec.isdigit():
                return [int(spec) - 1]
        except:
            pass
        return range(num_pages)

    def _calculate_coordinates(self, pw, ph, w, h, pos_type, cx, cy):
        if pos_type == 'custom':
            return cx, cy
        
        mapping = {
            'top-left': (0, 0),
            'top-center': (pw/2 - w/2, 0),
            'top-right': (pw - w, 0),
            'center-left': (0, ph/2 - h/2),
            'center': (pw/2 - w/2, ph/2 - h/2),
            'center-right': (pw - w, ph/2 - h/2),
            'bottom-left': (0, ph - h),
            'bottom-center': (pw/2 - w/2, ph - h),
            'bottom-right': (pw - w, ph - h),
        }
        return mapping.get(pos_type, (0, 0))