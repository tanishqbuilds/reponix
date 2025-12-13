import requests

def fetch_repo_tree(owner: str, repo: str, branch="main"):
    url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1"
    headers = {"Accept": "application/vnd.github.v3+json"}
    res = requests.get(url, headers=headers)
    if res.status_code != 200:
        raise Exception(f"GitHub API error: {res.status_code} - {res.text}")
    return res.json()

def filter_files(tree_json):
    exts = [".py", ".js", ".ts", ".jsx", ".tsx", ".java", ".go"]
    files = []
    for item in tree_json.get("tree", []):
        if item["type"] == "blob" and any(item["path"].endswith(ext) for ext in exts):
            files.append(item["path"])
    return files

def fetch_file_content(owner: str, repo: str, path: str, branch="main"):
    url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}"
    res = requests.get(url)
    return res.text if res.status_code == 200 else ""
