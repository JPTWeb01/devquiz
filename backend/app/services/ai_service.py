import json
import logging

logger = logging.getLogger(__name__)

TUTOR_SYSTEM_PROMPT = """You are a friendly, expert programming tutor for a developer education platform.
When a student answers a quiz question, give a clear, encouraging explanation in 2-4 sentences.
If the student was wrong: explain why their answer is incorrect and why the correct answer is right. Teach the underlying concept.
If the student was correct: briefly reinforce the concept and add one useful related insight.
Write naturally and conversationally. No bullet points or markdown."""

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


def explain_answer(
    question_text: str,
    question_type: str,
    correct_answer: str,
    user_answer: str,
    explanation: str,
    is_correct: bool,
    code_block: str | None = None,
    groq_api_key: str = "",
    gemini_api_key: str = "",
) -> str:
    code_section = f"\n\nCode:\n{code_block}" if code_block else ""
    status = "correctly" if is_correct else "incorrectly"
    user_prompt = (
        f"Question ({question_type.replace('_', ' ')}): {question_text}{code_section}\n\n"
        f"The student answered {status}: \"{user_answer}\"\n"
        f"Correct answer: \"{correct_answer}\"\n"
        f"Official explanation: \"{explanation}\"\n\n"
        f"Please explain this to the student in an encouraging, educational way."
    )

    if groq_api_key:
        try:
            from groq import Groq
            client = Groq(api_key=groq_api_key)
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": TUTOR_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                max_tokens=512,
                temperature=0.7,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.warning("Groq tutor failed: %s — trying Gemini", e)

    if gemini_api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_api_key)
            model = genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                system_instruction=TUTOR_SYSTEM_PROMPT,
            )
            response = model.generate_content(user_prompt)
            return response.text.strip()
        except Exception as e:
            logger.error("Gemini tutor also failed: %s", e)
            raise ValueError(f"AI tutor unavailable. Last error: {e}")

    raise ValueError("No AI provider configured.")


def chat_with_tutor(
    question_text: str,
    question_type: str,
    correct_answer: str,
    user_answer: str,
    explanation: str,
    is_correct: bool,
    history: list[dict],
    message: str | None = None,
    code_block: str | None = None,
    groq_api_key: str = "",
    gemini_api_key: str = "",
) -> str:
    code_section = f"\n\nCode:\n{code_block}" if code_block else ""
    status = "correctly" if is_correct else "incorrectly"

    system_content = (
        f"You are a friendly, expert programming tutor for a developer education platform.\n\n"
        f"Context — Quiz question the student just answered:\n"
        f"Type: {question_type.replace('_', ' ')}\n"
        f"Question: {question_text}{code_section}\n"
        f"Student answered {status}: \"{user_answer}\"\n"
        f"Correct answer: \"{correct_answer}\"\n"
        f"Official explanation: \"{explanation}\"\n\n"
        f"Help the student understand through conversation. Be encouraging, concise, and educational. "
        f"Write naturally — no bullet points or markdown."
    )

    user_msg = message or "Please explain this question and help me understand the correct answer."
    messages = [{"role": "system", "content": system_content}]
    messages.extend(history)
    messages.append({"role": "user", "content": user_msg})

    if groq_api_key:
        try:
            from groq import Groq
            client = Groq(api_key=groq_api_key)
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                max_tokens=512,
                temperature=0.7,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.warning("Groq tutor chat failed: %s — trying Gemini", e)

    if gemini_api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_api_key)
            model = genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                system_instruction=system_content,
            )
            gemini_history = [
                {"role": "user" if m["role"] == "user" else "model", "parts": [m["content"]]}
                for m in history
            ]
            chat = model.start_chat(history=gemini_history)
            response = chat.send_message(user_msg)
            return response.text.strip()
        except Exception as e:
            logger.error("Gemini tutor chat also failed: %s", e)
            raise ValueError(f"AI tutor unavailable. Last error: {e}")

    raise ValueError("No AI provider configured.")
