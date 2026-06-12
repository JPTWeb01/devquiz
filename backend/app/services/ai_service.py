import json
import logging

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an expert quiz question generator for a developer education platform.
Generate questions strictly in valid JSON — an array of question objects, no markdown, no extra text.

Each object must have:
- type: "mcq" | "predict_output" | "fill_blank" | "debugging"
- difficulty: "easy" | "medium" | "hard"
- question_text: string
- code_block: string or null
- options: array of {label, text} for mcq (labels A B C D), null for others
- correct_answer: string (letter for mcq, exact value for others)
- explanation: string
- points: 10 for easy, 15 for medium, 20 for hard

Mix types and difficulties. For predict_output and debugging, always include a code_block."""


def _parse_json(raw: str) -> list:
    raw = raw.strip()
    if raw.startswith("```"):
        parts = raw.split("```")
        raw = parts[1] if len(parts) > 1 else raw
        if raw.startswith("json"):
            raw = raw[4:]
    result = json.loads(raw.strip())
    if not isinstance(result, list):
        raise ValueError("Expected a list")
    return result


def _generate_with_groq(api_key: str, content: str, count: int, user_prompt: str) -> list:
    from groq import Groq
    client = Groq(api_key=api_key)
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=4096,
        temperature=0.7,
    )
    return _parse_json(response.choices[0].message.content)


def _generate_with_gemini(api_key: str, content: str, count: int, user_prompt: str) -> list:
    import google.generativeai as genai
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        system_instruction=SYSTEM_PROMPT,
    )
    response = model.generate_content(user_prompt)
    return _parse_json(response.text)


def generate_questions(
    content: str,
    count: int,
    groq_api_key: str = "",
    gemini_api_key: str = "",
    question_type: str = "",
) -> tuple[list, str]:
    """
    Returns (questions, provider_used).
    Tries Groq first, falls back to Gemini.
    Raises ValueError if neither provider is configured or both fail.
    """
    content = content[:12000]

    type_instruction = (
        f'Generate ONLY "{question_type}" type questions. '
        if question_type else ""
    )
    user_prompt = f"{type_instruction}Generate {count} quiz questions based on this content:\n\n{content}"

    if groq_api_key:
        try:
            questions = _generate_with_groq(groq_api_key, content, count, user_prompt)
            logger.info("Generated %d questions via Groq", len(questions))
            return questions, "groq"
        except Exception as e:
            logger.warning("Groq failed: %s — trying Gemini fallback", e)

    if gemini_api_key:
        try:
            questions = _generate_with_gemini(gemini_api_key, content, count, user_prompt)
            logger.info("Generated %d questions via Gemini", len(questions))
            return questions, "gemini"
        except Exception as e:
            logger.error("Gemini also failed: %s", e)
            raise ValueError(f"Both providers failed. Last error: {e}")

    raise ValueError("No AI provider configured. Set GROQ_API_KEY or GEMINI_API_KEY in .env")
