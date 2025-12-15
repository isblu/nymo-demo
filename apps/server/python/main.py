# Working Example
import torch
from transformers import AutoModel
from PIL import Image
import requests
from io import BytesIO

# 1. Load the Model
# 'trust_remote_code=True' is MANDATORY because this model uses custom code 
# for the EVA02 and XLM-RoBERTa architecture.
print("Loading model... (this may take a moment)")
model = AutoModel.from_pretrained(
    'jinaai/jina-clip-v2', 
    trust_remote_code=True,
    dtype=torch.float16,    # CHANGED: 'torch_dtype' -> 'dtype'
    device_map='auto',      
)

# 2. Prepare Inputs
# Text: Supports very long context (up to 8192 tokens)
sentences = [
    'A cute blue cat', 
    'A futuristic city', 
    'A delicious pizza'
]

# Image: Load an image from a URL (or local file)
url = 'https://i.pinimg.com/600x315/21/48/7e/21487e8e0970dd366dafaed6ab25d8d8.jpg'
response = requests.get(url)
image = Image.open(BytesIO(response.content))

# 3. Generate Embeddings
# The custom model class provides convenient .encode_text() and .encode_image() methods
print("Generating embeddings...")
with torch.no_grad():
    # Encode text
    text_embeddings = model.encode_text(sentences)
    
    # Encode image (inputs must be a list of PIL Images)
    image_embeddings = model.encode_image([image])

# 4. Calculate Similarity
# Compute cosine similarity: (Text @ Image.T)
# The embeddings are already normalized by the model, so we just do dot product.
similarity_scores = text_embeddings @ image_embeddings.T

# 5. Print Results
print("\nSimilarity Scores:")
for text, score in zip(sentences, similarity_scores):
    print(f"'{text}': {score.item():.4f}")

# Expected Output: 'A cute blue cat' should have the highest score.