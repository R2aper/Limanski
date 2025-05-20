#!/bin/bash 

#Directories
build_dir='build'
src_dir='src'

#If ./build is not exist 
if [ ! -e $build_dir ]; then
  mkdir -p $build_dir
fi 

#Copy all .html files into build dir
cp -r $src_dir/*.html $build_dir

#Run Typescript compiler
tsc 

#Open server 

#Change port if you need
port=5500
if [ $# -gt 0 ]; then
  port=$1
fi 

xdg-open http://localhost:$port/$build_dir
