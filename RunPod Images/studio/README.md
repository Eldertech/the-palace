# Palace Studio

A tiny local web app to generate images on your RunPod FLUX endpoint and keep
every result (with its prompt) on disk. Your prompts go to the GPU **verbatim**.

## Run

```bash
cd "The Palace/RunPod Images/studio"
export RUNPOD_API_KEY=your_key
export RUNPOD_ENDPOINT_ID=iy3ybd7qjl2trj      # the palace-flux endpoint
python3 palace_studio.py
```

Then open **http://localhost:8765**. Type a prompt, set size/seed/steps if you
like, hit **Generate**. Finished images appear in the gallery and are saved to
`./images/` with a `index.json` recording the prompt and settings.

Instead of env vars you can drop a `config.json` next to the script:

```json
{ "api_key": "your_key", "endpoint_id": "iy3ybd7qjl2trj" }
```

(Keep that file private — it holds your key. Don't commit it.)

## Notes
- **The endpoint must be enabled.** It's currently parked at 0 workers to avoid
  charges. Re-enable it in the RunPod console (Serverless → palace-flux → set
  Max Workers to 1+), or ask Claude to flip it back on.
- First generation after the endpoint sits idle is a **cold start** (a few
  minutes while the worker boots); after that, ~30s per image.
- Stdlib only — no `pip install`. The API key stays server-side (never sent to
  the browser), and RunPod calls are proxied, so there are no CORS issues.

_Loudon Live · Autodidact Polymaths_
