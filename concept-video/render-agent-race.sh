#!/bin/zsh
set -euo pipefail

script_dir="${0:A:h}"
output="$script_dir/agent-race-concept-v2.mp4"

ffmpeg -hide_banner -y \
  -f lavfi -i "color=c=0x080C16:s=1920x1080:r=30:d=24" \
  -f lavfi -i "sine=frequency=55:sample_rate=48000:duration=24" \
  -filter_complex "
    [0:v]
      drawgrid=w=120:h=120:t=1:c=0x282830@0.10,
      drawbox=x=0:y=820:w=1920:h=3:color=0xFF2020@0.85:t=fill,
      drawbox=x=0:y=810:w=1920:h=24:color=0xFF2020@0.10:t=fill,
      drawbox=x='-520+mod(t*82,3000)':y=0:w=460:h=1080:color=0xFF2020@0.035:t=fill,
      drawbox=x='1960-mod(t*58,2600)':y=0:w=260:h=1080:color=0xFFFFFF@0.018:t=fill,
      ass='$script_dir/agent-race-demo.ass'[v];
    [1:a]volume=0.035,
      afade=t=in:st=0:d=1,
      afade=t=out:st=22:d=2[a]
  " \
  -map "[v]" -map "[a]" \
  -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
  -c:a aac -b:a 128k -movflags +faststart -shortest \
  "$output"

echo "$output"

