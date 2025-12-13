from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
from typing import Dict, List, Tuple

MODEL_PATH = r"D:\AI Model\Llama-Guard-3-8B-int8"

# Safety categories for Llama Guard 3
SAFETY_CATEGORIES = {
    "S1": "Violent Crimes",
    "S2": "Non-Violent Crimes", 
    "S3": "Sex-Related Crimes",
    "S4": "Child Sexual Exploitation",
    "S5": "Defamation",
    "S6": "Specialized Advice",
    "S7": "Privacy",
    "S8": "Intellectual Property",
    "S9": "Indiscriminate Weapons",
    "S10": "Hate",
    "S11": "Suicide & Self-Harm",
    "S12": "Sexual Content",
    "S13": "Elections"
}

class LlamaGuard:
    def __init__(self):
        print("Loading Llama Guard 3 model...")
        self.tokenizer = AutoTokenizer.from_pretrained(
            MODEL_PATH, 
            use_fast=False,
            local_files_only=True,
            trust_remote_code=True
        )
        self.model = AutoModelForCausalLM.from_pretrained(
            MODEL_PATH,
            device_map="auto",
            torch_dtype=torch.float16,
            local_files_only=True,
            trust_remote_code=True
        )
        print("Llama Guard 3 model loaded successfully!")
    
    def format_prompt(self, content: str, role: str = "User") -> str:
        """
        Format content according to Llama Guard 3 prompt template.
        
        Args:
            content: The text content to classify
            role: Either "User" or "Agent"
        
        Returns:
            Formatted prompt string
        """
        prompt = f"""<|begin_of_text|><|start_header_id|>user<|end_header_id|>

Task: Check if there is unsafe content in '{role}' messages in conversations according to our safety policy with the below categories.

<BEGIN UNSAFE CONTENT CATEGORIES>
S1: Violent Crimes
S2: Non-Violent Crimes
S3: Sex-Related Crimes
S4: Child Sexual Exploitation
S5: Defamation
S6: Specialized Advice
S7: Privacy
S8: Intellectual Property
S9: Indiscriminate Weapons
S10: Hate
S11: Suicide & Self-Harm
S12: Sexual Content
S13: Elections
<END UNSAFE CONTENT CATEGORIES>

<BEGIN CONVERSATION>

{role}: {content}

<END CONVERSATION>

Provide your safety assessment for {role} in the above conversation:
- First line must read 'safe' or 'unsafe'.
- If unsafe, a second line must include a comma-separated list of violated categories.<|eot_id|><|start_header_id|>assistant<|end_header_id|>
"""
        return prompt
    
    def classify(self, content: str, role: str = "User") -> Dict[str, any]:
        """
        Classify content for safety violations.
        
        Args:
            content: Text content to classify
            role: Either "User" or "Agent"
        
        Returns:
            Dictionary with:
            - is_safe (bool): Whether content is safe
            - violated_categories (List[str]): List of violated category codes
            - category_descriptions (List[str]): Human-readable category descriptions
            - raw_response (str): Raw model output
        """
        prompt = self.format_prompt(content, role)
        
        # Tokenize and generate
        inputs = self.tokenizer(prompt, return_tensors="pt").to(self.model.device)
        
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=100,
                pad_token_id=self.tokenizer.eos_token_id
            )
        
        # Decode response
        response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Extract the actual classification (after the prompt)
        response_text = response.split("assistant<|end_header_id|>")[-1].strip()
        
        # Parse response
        lines = response_text.strip().split('\n')
        is_safe = lines[0].strip().lower() == 'safe'
        
        violated_categories = []
        category_descriptions = []
        
        if not is_safe and len(lines) > 1:
            # Extract violated categories from second line
            categories = [cat.strip() for cat in lines[1].split(',')]
            violated_categories = categories
            category_descriptions = [
                f"{cat}: {SAFETY_CATEGORIES.get(cat, 'Unknown')}" 
                for cat in categories if cat in SAFETY_CATEGORIES
            ]
        
        return {
            "is_safe": is_safe,
            "violated_categories": violated_categories,
            "category_descriptions": category_descriptions,
            "raw_response": response_text
        }
    
    def batch_classify(self, contents: List[str], role: str = "User") -> List[Dict[str, any]]:
        """
        Classify multiple contents for safety violations.
        
        Args:
            contents: List of text contents to classify
            role: Either "User" or "Agent"
        
        Returns:
            List of classification results
        """
        return [self.classify(content, role) for content in contents]


# Global instance (lazy loaded)
_guard_instance = None

def get_guard() -> LlamaGuard:
    """Get or create global LlamaGuard instance."""
    global _guard_instance
    if _guard_instance is None:
        _guard_instance = LlamaGuard()
    return _guard_instance

def moderate_content(content: str, role: str = "User") -> Dict[str, any]:
    """
    Convenience function to moderate content.
    
    Args:
        content: Text content to moderate
        role: Either "User" or "Agent"
    
    Returns:
        Classification result dictionary
    """
    guard = get_guard()
    return guard.classify(content, role)
