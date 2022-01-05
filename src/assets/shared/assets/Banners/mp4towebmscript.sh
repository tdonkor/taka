#!/bin/bash
filename = $(basename -- "$fullfile")
extension = "${filename##*.}"
filewithext = "${filename##*/}"
filename = "${filename%.*}"


for filename in $PWD/*; do
  #echo $(basename -- "${filename%.*}")
	#echo ${filename##*/}
	ffmpeg -i ${filename##*/} -c:v libvpx-vp9 -crf 30 -b:v 0 $(basename -- "${filename%.*}").webm
done

#ffmpeg -i $filepath.mp4 -c:v libvpx-vp9 -crf 30 -b:v 0 $filepath.webm