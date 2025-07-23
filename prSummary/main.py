import os
import requests
from summarizer import generate_summary

GITHUB_API = "https://api.github.com"
REPO = os.getenv("GITHUB_REPOSITORY")
PR_NUMBER = os.getenv("PR_NUMBER")
TOKEN = os.getenv("GITHUB_TOKEN")

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/vnd.github+json"
}

def get_pr_data():
    pr_url = f"{GITHUB_API}/repos/{REPO}/pulls/{PR_NUMBER}"
    files_url = f"{pr_url}/files"

    pr_resp = requests.get(pr_url, headers=headers)
    files_resp = requests.get(files_url, headers=headers)

    pr_body = pr_resp.json().get("body", "")
    file_changes = files_resp.json()

    diff = "\n".join([f"{file['filename']}\n{file.get('patch', '')}" for file in file_changes if 'patch' in file])
    return pr_body, diff

def post_comment(comment):
    url = f"{GITHUB_API}/repos/{REPO}/issues/{PR_NUMBER}/comments"
    requests.post(url, headers=headers, json={"body": comment})

if __name__ == "__main__":
    if not os.getenv("GEMINI_API_KEY"):
        print("[DEBUG] GEMINI_API_KEY is not set.")
    pr_body, diff = get_pr_data()
    summary = generate_summary(pr_body, diff)
    post_comment(f"**PR Summary**\n\n{summary}")