import numpy as np
import math


## do the comparison between groundtruth and our estimation

gt_file = open("gt.txt", "w")
with open("results.txt",'rb') as f:
    first = f.readline()      # Read the first line.
    f.seek(-2, 2)             # Jump to the second last byte.
    while f.read(1) != b"\n": # Until EOL is found...
        f.seek(-2, 1)         # ...jump back the read byte plus one more.
    last = f.readline()       # Read last line.

t_start = float(first.split( )[0]);
t_last = float(last.split( )[0]);

with open("Robot1_Groundtruth.dat",'r') as gt:
    gt.readline()
    gt.readline()
    gt.readline()
    gt.readline()
    
    s_gt = gt.readline()
    t_gt = float(s_gt.split( )[0])
    while t_gt <= t_last:
        s_gt = gt.readline()
        
        if t_gt >= t_start:
           gt_file.write(s_gt)

        t_gt = float(s_gt.split( )[0])


print(str(t_start) + '\n' + str(t_last) +'\n')

gt_file.close
