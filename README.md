# nymo-demo

## Setup

```bash
git clone https://github.com/isblu/nymo-demo.git
cd nymo-demo
bun i
```

### Python Environment

```bash
cd apps/server/python
py -m venv .jina_env
.\.jina_env\Scripts\Activate.ps1
python.exe -m pip install --upgrade pip
pip install torch --index-url https://download.pytorch.org/whl/cpu 
pip install -r requirements.txt
cd ../../..
```

### Run

```bash
bun dev
```

This starts both the web server and backend server. 