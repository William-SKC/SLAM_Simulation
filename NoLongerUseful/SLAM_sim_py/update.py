import numpy as np
import math

import parameters

def propagation_update(s, sigma_s, s_odo, delta_t):
    v = float(s_odo.split( )[1])
	omega = float(s_odo.split( )[2])
	
    # 1 st order
	s[0] = s[0] + v * delta_t * math.cos(s[2])
	s[1] = s[1] + v * delta_t * math.sin(s[2])
	s[2] = s[2] + omega * delta_t

	# 2 nd order
    
    
	W = np.matrix([[delta_t*math.cos(s[2]), 0], [delta_t*math.sin(s[2]), 0], [0, delta_t]])
    A = np.matrix([[1, 0, -1*v*delta_t*math.sin(s[2])],[0, 1, 1*v*delta_t*math.cos(s[2])],[0, 0, 1]])
    
    
    sigma_s = A*sigma_s*A.getT() + W * parameters.sigma_odo * W.getT()
	return [s, sigma_s]


def landmark_obser_update(s, sigma_s, s_meas, landmark):
	# TODO
    delta_x = landmark[0] - s[0]
	delta_y = landmark[1] - s[1]

	distance = math.sqrt(delta_x*delta_x + delta_y*delta_y) 
	angle = math.atan2(delta_y, delta_x) - s[2]


	invention = [float(s_meas.split( )[2])-distance , float(s_meas.split( )[3])-angle]


	c = 1 + math.pow(delta_y / delta_x, 2)
	h = np.matrix([[-delta_x/distance, delta_y/(c*delta_x*delta_x)], [-delta_y/distance, -1/(c*delta_x)], [0, -1]])

    kalman_gain = sigma_s * h * parameters.sigma_o.I #??

	s[0] = s[0] + kalman_gain.item(0,0) * invention[0] + kalman_gain.item(0,1) * invention[1]
	s[1] = s[1] + kalman_gain.item(1,0) * invention[0] + kalman_gain.item(1,1) * invention[1]
    s[2] = (s[2] + kalman_gain.item(2,0) * invention[0] + kalman_gain.item(2,1) * invention[1]) % (2*math.pi)

    sigma_s = sigma_s - kalman_gain * parameters.sigma_o * kalman_gain.T #??
        #sigma_s = sigma_s - kalman_gain * h * kalman_gain
	return [s, sigma_s]


def relative_obser_update(s, sigma_s):
	# TODO

	return [s, sigma_s]
