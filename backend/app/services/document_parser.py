import fitz
import pytesseract
from PIL import Image
from io import BytesIO
from pypdf import PdfReader


def extract_text(file_path: str) -> str:
    # First try normal PDF text extraction
    reader = PdfReader(file_path)

    text = ""

    for page in reader.pages:
        text += page.extract_text() or ""

    # If the PDF already contains text, use it
    if text.strip():
        return text

    # Otherwise, use OCR for scanned PDFs
    pdf = fitz.open(file_path)

    ocr_text = ""

    for page in pdf:
        pix = page.get_pixmap(dpi=300)

        image = Image.open(
            BytesIO(pix.tobytes("png"))
        )

        ocr_text += pytesseract.image_to_string(image)
        ocr_text += "\n"

    pdf.close()

    return ocr_text