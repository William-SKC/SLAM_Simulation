!/bin/bash

python local_sim.py
python comparison.py
matlab -nojvm < loc_sim_script.m
