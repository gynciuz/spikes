#!/bin/zsh
# Transcribe the embedded video from the CenterCentre article.
# Run on your Mac:  zsh ~/Downloads/transcribe-ux-vision.sh
# Output:           ~/Downloads/ux-vision-transcript/transcript.md
set -uo pipefail

PAGE_URL="https://centercentre.com/convincing-stakeholders-to-embrace-your-ux-vision/"
MODEL="${MODEL:-base}"            # tiny | base | small | medium | large
OUT="$HOME/Downloads/ux-vision-transcript"
mkdir -p "$OUT" && cd "$OUT"

echo "== 1/4 Checking tools"
command -v brew  >/dev/null || { echo "Homebrew missing: https://brew.sh"; exit 1; }
command -v ffmpeg >/dev/null || brew install ffmpeg
command -v yt-dlp >/dev/null || brew install yt-dlp
command -v whisper >/dev/null || pip3 install -U openai-whisper

echo "== 2/4 Finding the embedded video"
curl -sL -A "Mozilla/5.0" "$PAGE_URL" -o page.html
grep -oE 'https?://[^"'"'"' <>]*(youtube\.com/embed|youtube\.com/watch|youtu\.be|vimeo\.com|wistia\.(com|net)|\.mp4|\.m4a|\.mp3)[^"'"'"' <>]*' page.html \
  | sed 's/&amp;/\&/g' | sort -u > video_urls.txt
cat video_urls.txt
VIDEO="$(head -1 video_urls.txt)"
[ -n "$VIDEO" ] || VIDEO="$PAGE_URL"   # yt-dlp can also discover embeds from the page itself
echo "Using: $VIDEO"

echo "== 3/4 Getting captions (platform subtitles first, Whisper as fallback)"
rm -f video*.srt
yt-dlp --skip-download --write-subs --write-auto-subs --sub-langs "en.*" \
       --convert-subs srt -o "video.%(ext)s" "$VIDEO" || true
if ! ls video*.srt >/dev/null 2>&1; then
  echo "No platform captions. Downloading audio and running Whisper ($MODEL)..."
  yt-dlp -x --audio-format m4a -o "video.%(ext)s" "$VIDEO" || { echo "Download failed. Open video_urls.txt and pass the right URL: VIDEO=<url> zsh $0"; exit 1; }
  whisper video.m4a --model "$MODEL" --language en --output_format srt
fi

echo "== 4/4 Converting to Markdown"
python3 - <<'PY'
import re, glob
srt = sorted(glob.glob("video*.srt"))[0]
blocks = re.split(r"\n\n+", open(srt, encoding="utf-8").read().strip())
lines, last = [], None
for b in blocks:
    p = b.split("\n")
    if len(p) < 3: continue
    ts = p[1].split(" --> ")[0].split(",")[0]
    ts = ts[3:] if ts.startswith("00:") else ts
    text = re.sub(r"<[^>]+>", "", " ".join(p[2:])).strip()
    if text and text != last:
        lines.append(f"[{ts}] {text}"); last = text
open("transcript.md", "w", encoding="utf-8").write(
    "# Transcript - Convincing Stakeholders to Embrace Your UX Vision\n\n"
    f"Source: https://centercentre.com/convincing-stakeholders-to-embrace-your-ux-vision/\n\n"
    + "\n\n".join(lines))
print(f"Done: {__import__('os').getcwd()}/transcript.md  ({len(lines)} segments from {srt})")
PY
