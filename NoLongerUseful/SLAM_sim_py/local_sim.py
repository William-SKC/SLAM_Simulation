import numpy as np
import math

import update
import parameters

### Build landmark map
landmark_map = {}

landmark_file = open("Landmark_Groundtruth.dat", 'r')

s = landmark_file.readline()

while(s):
	if(s[0]!='#'):
		landmark_location = [float(s.split( )[1]), float(s.split( )[2])]
		landmark_map.update({s.split( )[0]: landmark_location})

	s = landmark_file.readline()

landmark_file.close()


####

measure_file = open("Robot1_Measurement_x.dat", 'r')
odometry_file = open("Robot1_Odometry.dat", 'r')

## Initialization
odometry_file.readline()
odometry_file.readline()
odometry_file.readline()
odometry_file.readline()

s_odo = odometry_file.readline()
t_odo = float(s_odo.split( )[0])

s_meas = measure_file.readline()
t_meas = float(s_meas.split( )[0])


##### Main


t = 1248272272.839 	 
s = [3.57329770, -3.33288210, 2.34100000]

sigma_s = np.matrix('0.01 0 0; 0 0.01 0; 0 0 0.01')



result_file = open("Results.txt", "w")


for i in range(1000):
	# propagation update
	if(t_odo < t_meas):
            delta_t = t_odo - t
            
            [s, sigma_s] = update.propagation_update(s, sigma_s, s_odo, delta_t)
            result_file.write(str(t_odo)+' \t'+str(s[0]) + ' \t' +str(s[1]) + ' \t' +str(s[2]) + '\n')
                
            t = t_odo
            s_odo = odometry_file.readline()
            t_odo = float(s_odo.split( )[0])

	# measurement update
	else:
		#delta_t = t_meas - t

		landmark_id = s_meas.split( )[1]


		if int(landmark_id) > 5:
            landmark = landmark_map[landmark_id]
			[s, sigma_s] = update.landmark_obser_update(s, sigma_s, s_meas, landmark)
            result_file.write(str(t_meas)+' \t'+str(s[0]) + ' \t' +str(s[1]) + ' \t' +str(s[2]) + '\n')

        else:
        ##[s, sigma_s] = update.relative_obser_update(s, sigma_s)


		#t = t_meas

		s_meas = measure_file.readline()
		t_meas = float(s_meas.split( )[0])
##


result_file.close()
measure_file.close()
odometry_file.close()
