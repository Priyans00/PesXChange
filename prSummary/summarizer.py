import google.generativeai as genai
import os

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def generate_summary(pr_body, diff):
    prompt = f"""
You are a GitHub bot. Summarize the following pull request based on its description and code diff:

### PR Description:
{pr_body}

### Code Diff:
{diff[:8000]}  # truncate to avoid token limit

Respond concisely in bullet points.
"""

    model = genai.GenerativeModel("gemini-2.5-flash")
    response = model.generate_content(prompt)
    return response.text.strip()