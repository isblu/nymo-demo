from transformers import AutoModel, AutoTokenizer

model = AutoModel.from_pretrained("jinaai/jina-clip-v2", trust_remote_code=True)
tokenizer = AutoTokenizer.from_pretrained("jinaai/jina-clip-v2", trust_remote_code=True)

model.save_pretrained("./jina-v2-local")
tokenizer.save_pretrained("./jina-v2-local")

print("Download complete.")