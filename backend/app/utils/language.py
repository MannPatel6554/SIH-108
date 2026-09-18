"""
Language Detection and Normalization for BIS SmartSpec AI
Supports English + Hindi queries.
"""
from typing import Tuple
from loguru import logger


def detect_language(text: str) -> str:
    """
    Detect language of input text.
    Returns ISO 639-1 code: 'en', 'hi', or 'mixed'.
    """
    try:
        from langdetect import detect, DetectorFactory
        DetectorFactory.seed = 42
        lang = detect(text)
        if lang == 'hi':
            return 'hi'
        elif lang in ('en', 'en-US', 'en-GB'):
            return 'en'
        else:
            return 'en'  # Default to English for other languages
    except Exception:
        # Fallback: check for Devanagari characters
        devanagari_chars = sum(1 for c in text if '\u0900' <= c <= '\u097F')
        total_chars = len([c for c in text if c.strip()])
        if total_chars > 0 and devanagari_chars / total_chars > 0.3:
            return 'hi'
        return 'en'


HINDI_SYNONYMS = {
    "पानी": "जल पानी",
    "सप्लाई": "आपूर्ति सप्लाई",
    "बिजली": "विद्युत बिजली",
    "सड़क": "मार्ग सड़क",
    "रोड": "सड़क रोड",
    "इमारत": "भवन निर्माण इमारत",
}


def normalize_query(text: str, language: str = None) -> Tuple[str, str]:
    """
    Normalize query text.
    
    Returns:
        (normalized_text, detected_language)
    """
    # Strip excessive whitespace
    text = ' '.join(text.split())
    
    # Detect language if not provided
    if not language or language == 'auto':
        detected = detect_language(text)
    else:
        detected = language

    # Basic normalization
    normalized = text.strip()

    # Expand Hindi procurement synonyms if query contains Hindi
    if detected == 'hi' or has_devanagari(normalized):
        words = normalized.split()
        expanded_words = []
        for word in words:
            if word in HINDI_SYNONYMS:
                expanded_words.append(HINDI_SYNONYMS[word])
            else:
                expanded_words.append(word)
        normalized = ' '.join(expanded_words)

    return normalized, detected


def has_devanagari(text: str) -> bool:
    """Check if text contains Hindi/Devanagari characters."""
    return any('\u0900' <= c <= '\u097F' for c in text)


def extract_is_references(text: str) -> list:
    """
    Extract IS standard references from text using regex patterns.
    Handles patterns like:
    - IS 1234
    - IS:1234
    - IS 1234 : 2020
    - IS 1234/Part 1
    - Indian Standard 1234
    """
    import re
    patterns = [
        r'\bIS[\s:]?\s*(\d{1,5})(?:\s*(?:Part|Pt\.?)\s*(\d+))?(?:\s*(?:Section|Sec\.?)\s*(\d+))?(?:\s*:\s*(\d{4}))?\b',
        r'\bIndian Standard[\s:]?\s*(\d{1,5})\b',
    ]
    
    results = []
    seen = set()
    
    for pattern in patterns:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            number = match.group(1)
            part = match.group(2) if len(match.groups()) > 1 else None
            year = match.group(4) if len(match.groups()) > 3 else None
            
            canonical = f"IS {number}"
            if part:
                canonical += f" Part {part}"
            
            if canonical not in seen:
                seen.add(canonical)
                results.append({
                    "standard_number": canonical,
                    "year": int(year) if year else None,
                    "raw": match.group(0).strip(),
                })
    
    return results
