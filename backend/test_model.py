from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

MODEL_PATH = r"D:\AI Model\Llama-Guard-3-8B-int8"

print("Loading model...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH, use_fast=False)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_PATH,
    device_map="auto",
    torch_dtype=torch.float16
)
print("Model loaded successfully!")

prompt = "Analyze this code snippet and suggest improvements:\n\nprint('Hello World')"
inputs = tokenizer(prompt, return_tensors="pt")
outputs = model.generate(**inputs, max_new_tokens=50)

result = tokenizer.decode(outputs[0], skip_special_tokens=True)
print("AI Response:\n", result)
