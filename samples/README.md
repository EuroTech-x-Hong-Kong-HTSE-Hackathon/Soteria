# Sample audio for the scam-call demo

Drop one or two short call recordings here, then run:

```bash
python scripts/scam_demo.py samples/scam_sample.wav
```

## Notes

- **These files are gitignored** (`*.wav`, `*.mp3` — see `.gitignore`). Keep
  recordings local; never commit real call audio.
- faster-whisper handles **16 kHz mono** best. Convert/resample with ffmpeg:

  ```bash
  ffmpeg -i in.mp3 -ar 16000 -ac 1 samples/scam_sample.wav
  ```

- Keep clips short (a few sentences) for a fast demo. A scripted line like
  *"This is the IRS, you owe back taxes — pay 500 dollars in gift cards now or
  you will be arrested"* exercises the red-flag path well.
