"""
LLM Provider Abstraction for BIS SmartSpec AI

Providers:
- MockProvider: Template-based, always works, no API needed
- OllamaProvider: Local LLM via Ollama
- OpenAICompatibleProvider: Any OpenAI-compatible endpoint

The MockProvider is the default and ensures the app works without any LLM.
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from loguru import logger


class LLMProvider(ABC):
    """Abstract base class for LLM providers."""

    @abstractmethod
    def generate_explanation(
        self,
        query: str,
        standard_number: str,
        standard_title: str,
        evidence_text: str,
        language: str = "en",
    ) -> str:
        """Generate a relevance explanation for a retrieved standard."""
        pass

    @abstractmethod
    def is_available(self) -> bool:
        pass


class MockProvider(LLMProvider):
    """
    Template-based explanation provider.
    No LLM required. Always works in demo mode.
    Generates structured, honest explanations from retrieved evidence.
    
    Labeled as 'AI-generated explanation (template-based)' in UI.
    """

    def generate_explanation(
        self,
        query: str,
        standard_number: str,
        standard_title: str,
        evidence_text: str,
        language: str = "en",
    ) -> str:
        query_lower = query.lower()
        
        # Extract meaningful context from evidence
        evidence_lines = [line.strip() for line in evidence_text.split('\n') if line.strip()]
        description_line = ""
        scope_line = ""
        
        for line in evidence_lines:
            if line.startswith("Description:"):
                description_line = line[12:].strip()[:200]
            elif line.startswith("Scope:"):
                scope_line = line[6:].strip()[:200]

        if language == "hi":
            return self._generate_hindi_explanation(
                query, standard_number, standard_title, description_line, scope_line
            )
        
        return self._generate_english_explanation(
            query, standard_number, standard_title, description_line, scope_line
        )

    def _generate_english_explanation(
        self, query: str, number: str, title: str, description: str, scope: str
    ) -> str:
        parts = []
        
        if description:
            parts.append(f"This standard covers {description[:150]}.")
        
        if scope:
            parts.append(f"Its scope includes: {scope[:150]}.")

        # Add query-specific context
        query_lower = query.lower()
        if any(w in query_lower for w in ["pipe", "tube", "supply", "water", "पाइप", "जल"]):
            parts.append(
                "Based on your procurement requirement for pipe/water supply applications, "
                "this standard specifies the technical requirements that the procured material should meet."
            )
        elif any(w in query_lower for w in ["led", "light", "lighting", "luminaire", "street", "एलईडी"]):
            parts.append(
                "This standard is applicable to your LED lighting procurement as it specifies "
                "performance, safety, and testing requirements for such equipment."
            )
        elif any(w in query_lower for w in ["cable", "wire", "electrical", "pvc", "केबल"]):
            parts.append(
                "This standard covers specifications relevant to electrical cable procurement, "
                "including material, insulation, and testing requirements."
            )
        elif any(w in query_lower for w in ["cement", "concrete", "construction", "सीमेंट"]):
            parts.append(
                "This standard is relevant to your construction material procurement, "
                "specifying quality, strength, and composition requirements."
            )
        elif any(w in query_lower for w in ["helmet", "safety", "ppe", "protection", "हेलमेट"]):
            parts.append(
                "This safety standard specifies requirements for personal protective equipment "
                "relevant to your procurement of safety gear."
            )
        else:
            parts.append(
                "Based on semantic similarity between your procurement specification and this standard's "
                "scope, description, and keywords, this standard appears relevant to your requirement."
            )

        parts.append(
            "[AI-generated explanation (template-based) — Verify against official BIS source before use in procurement.]"
        )
        
        return " ".join(parts)

    def _generate_hindi_explanation(
        self, query: str, number: str, title: str, description: str, scope: str
    ) -> str:
        parts = []
        
        if description:
            parts.append(f"यह मानक {description[:150]} को कवर करता है।")
        
        parts.append(
            f"आपकी खरीद विनिर्देश और {number} के दायरे, विवरण और कीवर्ड के बीच "
            "अर्थपूर्ण समानता के आधार पर यह मानक प्रासंगिक प्रतीत होता है।"
        )
        
        parts.append(
            "[एआई-उत्पन्न स्पष्टीकरण (टेम्पलेट-आधारित) — खरीद में उपयोग से पहले आधिकारिक BIS स्रोत से सत्यापित करें।]"
        )
        
        return " ".join(parts)

    def is_available(self) -> bool:
        return True


class OllamaProvider(LLMProvider):
    """
    Local LLM via Ollama.
    Requires Ollama running at OLLAMA_BASE_URL.
    Implements strict hallucination-prevention prompt.
    """

    SYSTEM_PROMPT = """You are a procurement standards assistant for Indian government procurement.
Your task is to explain why a specific Indian Standard (IS) is relevant to a procurement specification.

CRITICAL RULES:
1. NEVER invent IS numbers, titles, revision years, amendment numbers, or certification requirements.
2. Use ONLY the retrieved evidence provided. Do not add information not present in the evidence.
3. If evidence is insufficient to explain relevance, say "Evidence is insufficient to fully explain relevance."
4. Do NOT claim that a standard is mandatory unless the evidence explicitly states so.
5. Keep your explanation concise (2-4 sentences).
6. End with: [AI-generated — Verify against official BIS source before use in procurement.]
"""

    def __init__(self, base_url: str, model: str):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self._available: Optional[bool] = None

    def _check_availability(self) -> bool:
        try:
            import httpx
            r = httpx.get(f"{self.base_url}/api/tags", timeout=3.0)
            return r.status_code == 200
        except Exception:
            return False

    def is_available(self) -> bool:
        if self._available is None:
            self._available = self._check_availability()
            if self._available:
                logger.info(f"Ollama available at {self.base_url} with model {self.model}")
            else:
                logger.warning(f"Ollama not available at {self.base_url}")
        return self._available

    def generate_explanation(
        self,
        query: str,
        standard_number: str,
        standard_title: str,
        evidence_text: str,
        language: str = "en",
    ) -> str:
        if not self.is_available():
            return MockProvider().generate_explanation(
                query, standard_number, standard_title, evidence_text, language
            )

        user_message = f"""Procurement specification: "{query}"

Retrieved standard:
Number: {standard_number}
Title: {standard_title}

Evidence from database:
{evidence_text[:800]}

Explain in 2-4 sentences why this standard is relevant to the procurement specification.
Use ONLY the evidence provided. Language: {"Hindi" if language == "hi" else "English"}."""

        try:
            import httpx
            response = httpx.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": f"{self.SYSTEM_PROMPT}\n\n{user_message}",
                    "stream": False,
                    "options": {"temperature": 0.1, "num_predict": 200},
                },
                timeout=30.0,
            )
            if response.status_code == 200:
                data = response.json()
                return data.get("response", "").strip()
        except Exception as e:
            logger.error(f"Ollama generation failed: {e}")

        # Fallback
        return MockProvider().generate_explanation(
            query, standard_number, standard_title, evidence_text, language
        )


def create_llm_provider(provider_name: str = None) -> LLMProvider:
    """Factory function to create LLM provider."""
    from app.core.config import settings
    
    name = (provider_name or settings.LLM_PROVIDER).lower()
    
    if name == "ollama":
        return OllamaProvider(
            base_url=settings.OLLAMA_BASE_URL,
            model=settings.OLLAMA_MODEL,
        )
    else:
        return MockProvider()


# Singleton
_llm_provider: Optional[LLMProvider] = None


def get_llm_provider() -> LLMProvider:
    global _llm_provider
    if _llm_provider is None:
        _llm_provider = create_llm_provider()
    return _llm_provider
