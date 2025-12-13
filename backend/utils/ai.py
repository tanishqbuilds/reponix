from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

MODEL_PATH = r"D:\AI Model\Llama-Guard-3-8B-int8"

tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH, use_fast=False)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_PATH,
    device_map="auto",
    torch_dtype=torch.float16
)

def analyze_code(code_chunk: str, max_tokens=500):
    prompt = f"""
Analyze the following code for:
- Bugs
- Security vulnerabilities
- AI-generated / copied patterns
- Optimization suggestions

Code:
{code_chunk}

Provide a structured response (JSON-like if possible).
"""
    inputs = tokenizer(prompt, return_tensors="pt")
    outputs = model.generate(**inputs, max_new_tokens=max_tokens)
    return tokenizer.decode(outputs[0], skip_special_tokens=True)
