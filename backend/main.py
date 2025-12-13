from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from utils.github import fetch_repo_tree, filter_files, fetch_file_content
from utils.ai import analyze_code
import asyncio

app = FastAPI()

class RepoRequest(BaseModel):
    repo_url: str

@app.post("/analyze")
async def analyze_repo(req: RepoRequest):
    try:
        url_parts = req.repo_url.rstrip("/").split("/")
        owner, repo = url_parts[-2], url_parts[-1]

        tree_json = fetch_repo_tree(owner, repo)
        files = filter_files(tree_json)

        if not files:
            return {"status": "success", "analysis": {}, "message": "No supported code files found"}

        async def get_file(path):
            return path, fetch_file_content(owner, repo, path)

        results = await asyncio.gather(*(get_file(f) for f in files))
        analysis_results = {}

        for path, content in results:
            if content.strip():
                analysis_results[path] = analyze_code(content)

        return {"status": "success", "analysis": analysis_results}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
