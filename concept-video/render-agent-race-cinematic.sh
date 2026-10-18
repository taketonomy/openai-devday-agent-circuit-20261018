#!/bin/zsh
set -euo pipefail

script_dir="${0:A:h}"
input="$script_dir/assets/agent-race-key-art-v1.png"
output="$script_dir/agent-race-cinematic-v3.mp4"

ffmpeg -hide_banner -y \
  -loop 1 -framerate 30 -i "$input" \
  -f lavfi -i "sine=frequency=48:sample_rate=48000:duration=24" \
  -filter_complex "
    [0:v]
      scale=2200:1238,
      zoompan=z='min(zoom+0.00035,1.085)':x='iw/2-(iw/zoom/2)+65*sin(on/110)':y='ih/2-(ih/zoom/2)+22*cos(on/130)':d=720:s=1920x1080:fps=30,
      eq=contrast=1.07:saturation=0.92:brightness=-0.035,
      drawbox=x=0:y=0:w=760:h=1080:color=black@0.30:t=fill,
      drawbox=x=0:y=0:w=1920:h=5:color=0xFF2020@0.7:t=fill,
      ass='$script_dir/agent-race-cinematic.ass'[v];
    [1:a]volume=0.032,
      afade=t=in:st=0:d=1,
      afade=t=out:st=22:d=2[a]
  " \
  -map "[v]" -map "[a]" -t 24 \
  -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
  -c:a aac -b:a 128k -movflags +faststart \
  "$output"

echo "$output"

