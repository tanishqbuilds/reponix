# Llama Guard 3 Implementation

This directory contains the implementation of Llama Guard 3 for content safety moderation.

## Files

- **llama_guard.py**: Main Llama Guard 3 service module
- **test_llama_guard.py**: Comprehensive test script with various content examples
- **requirements.txt**: Updated with necessary dependencies

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Run Tests

```bash
python test_llama_guard.py
```

## Usage

### Basic Usage

```python
from llama_guard import moderate_content

# Check if content is safe
result = moderate_content("Hello! Can you help me code?")

print(f"Is Safe: {result['is_safe']}")
if not result['is_safe']:
    print(f"Violations: {result['category_descriptions']}")
```

### Advanced Usage

```python
from llama_guard import get_guard

# Get guard instance
guard = get_guard()

# Classify single content
result = guard.classify("Your content here", role="User")

# Batch classification
contents = ["content 1", "content 2", "content 3"]
results = guard.batch_classify(contents)
```

## Safety Categories

Llama Guard 3 checks for the following 13 safety categories:

- **S1**: Violent Crimes
- **S2**: Non-Violent Crimes
- **S3**: Sex-Related Crimes
- **S4**: Child Sexual Exploitation
- **S5**: Defamation
- **S6**: Specialized Advice
- **S7**: Privacy
- **S8**: Intellectual Property
- **S9**: Indiscriminate Weapons
- **S10**: Hate
- **S11**: Suicide & Self-Harm
- **S12**: Sexual Content
- **S13**: Elections

## API Response Format

```python
{
    "is_safe": bool,                          # True if content is safe
    "violated_categories": List[str],         # List of category codes (e.g., ["S1", "S2"])
    "category_descriptions": List[str],       # Human-readable descriptions
    "raw_response": str                       # Raw model output
}
```

## Integration with Existing Code

To integrate with the existing code analysis pipeline in `main.py`:

```python
from llama_guard import moderate_content

# Before analyzing code, check if the input is safe
@app.post("/analyze")
async def analyze_repo(req: RepoRequest):
    # Moderate the repo URL or user input
    moderation = moderate_content(req.repo_url, role="User")
    
    if not moderation['is_safe']:
        return {
            "status": "error",
            "message": "Content flagged by safety system",
            "violations": moderation['category_descriptions']
        }
    
    # Continue with normal analysis...
```

## Model Path

The model is loaded from: `D:\AI Model\Llama-Guard-3-8B-int8`

Make sure this path exists and contains the model files before running.

## Performance Notes

- Model runs on GPU with float16 precision
- First inference may be slower due to model loading
- Subsequent inferences are much faster
- Consider keeping the guard instance warm for production use
