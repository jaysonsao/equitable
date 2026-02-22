import os
import google.generativeai as genai

_model = None


def _get_model():
    global _model
    if _model is None:
        api_key = os.environ.get("GEMINI_API_KEY", "")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY not set")
        genai.configure(api_key=api_key)
        _model = genai.GenerativeModel("gemini-1.5-flash")
    return _model


def ask(prompt: str) -> str:
    model = _get_model()
    response = model.generate_content(prompt)
    return response.text


def ask_about_neighborhood(neighborhood: str, context: dict) -> str:
    prompt = f"""
You are an assistant helping users understand food access and income inequality in Boston neighborhoods.

Neighborhood: {neighborhood}
Income Inequality (Gini Index): {context.get('gini', 'unknown')}
Nearby Farmers Markets: {context.get('markets', [])}

Give a brief, helpful 2-3 sentence summary about food equity in this neighborhood based on the data above.
"""
    return ask(prompt)
