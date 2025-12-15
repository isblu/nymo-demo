from transformers import AutoModel, AutoTokenizer

# This downloads the weights AND the remote code files automatically
model = AutoModel.from_pretrained("jinaai/jina-clip-v2", trust_remote_code=True)
tokenizer = AutoTokenizer.from_pretrained("jinaai/jina-clip-v2", trust_remote_code=True)

# Save them to a local folder
model.save_pretrained("./jina-v2-local")
tokenizer.save_pretrained("./jina-v2-local")

print("Download complete. You can now use './jina-v2-local' offline.")