import numpy as np
import math




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

print(landmark_map)





#####

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





t = 1248272272.839 	 
s = [3.57329770, -3.33288210, 2.34100000]
sigma_s = np.matrix('0.01 0 0; 0 0.01 0; 0 0 0.01')

sigma_o = np.matrix(' 0.01 0; 0 0.1')

sigma_odo = np.matrix('0.001 0; 0 0.001')


result_file = open("Results.txt", "w")

for i in range(1000):
	# propagation update
	if(t_odo < t_meas):
		delta_t = t_odo - t

		v = float(s_odo.split( )[1])
		omega = float(s_odo.split( )[2])

		# 1 st order
		
		s[0] = s[0] + v * delta_t * math.cos(s[2])
		s[1] = s[1] + v * delta_t * math.sin(s[2])
		s[2] = s[2] + omega * delta_t

		# 2 nd order
		f = np.matrix([[delta_t*math.cos(s[2]), 0], [delta_t*math.sin(s[2]), 0], [0, delta_t]])
		sigma_s = sigma_s + f * sigma_odo * f.getT()

		print('* ' + str(t_odo)+' '+str(s[0]) + ' ' +str(s[1]) + ' ' +str(s[2]) + ' ')
                result_file.write(str(t_odo)+' \t'+str(s[0]) + ' \t' +str(s[1]) + ' \t' +str(s[2]) + '\n')

		t = t_odo

		s_odo = odometry_file.readline()
		t_odo = float(s_odo.split( )[0])

	# measurement update
	else:
		delta_t = t_meas - t

		landmark_id = s_meas.split( )[1]



		if int(landmark_id) > 5:
			landmark = landmark_map[landmark_id]

			delta_x = landmark[0] - s[0]
			delta_y = landmark[1] - s[1]

			distance = math.sqrt(delta_x*delta_x + delta_y*delta_y) 
			angle = math.atan2(delta_y, delta_x) - s[2]


			invention = [float(s_meas.split( )[2])-distance , float(s_meas.split( )[3])-angle]


			c = 1 + math.pow(delta_y / delta_x, 2)
			h = np.matrix([[-delta_x/distance, delta_y/(c*delta_x*delta_x)], [-delta_y/distance, -1/(c*delta_x)], [0, -1]])

			kalman_gain = sigma_s * h * sigma_o.I

			s[0] = s[0] + kalman_gain.item(0,0) * invention[0] + kalman_gain.item(0,1) * invention[1]
			s[1] = s[1] + kalman_gain.item(1,0) * invention[0] + kalman_gain.item(1,1) * invention[1]
			s[2] = (s[2] + kalman_gain.item(2,0) * invention[0] + kalman_gain.item(2,1) * invention[1]) % (2*math.pi)

			sigma_s = sigma_s - kalman_gain * sigma_o * kalman_gain.T

			print('= ' + str(t_meas)+' '+str(s[0]) + ' ' +str(s[1]) + ' ' +str(s[2]) + ' ')
                        result_file.write(str(t_meas)+' \t'+str(s[0]) + ' \t' +str(s[1]) + ' \tt' +str(s[2]) + '\n')

		t = t_meas

		s_meas = measure_file.readline()
		t_meas = float(s_meas.split( )[0])
##


result_file.close()
measure_file.close()
odometry_file.close()
