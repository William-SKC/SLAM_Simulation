from numpy import matrix
from numpy import linalg as LA
import numpy as np


from ls_cen import RobotTeamLocalCen
import sim_env

import math


# import parameters

N = sim_env.num_robot 
M = sim_env.num_landmark 

itr = sim_env.iteration 
time = sim_env.time_end



# recording container

sigma_tr_arr = [0] * time
sigma_th_tr_arr = [0] * time
error_arr = [0] * time


# topology

# main 

for i in range(itr):

	print(i)

	initial = matrix([1, 1, 1, 2, 2, 1, -1, -1, 1, 3], dtype=float).T


	robots = RobotTeamLocalCen(initial)


	landmarks = [None] * M
	for m in range(M):
		landmarks[m] = sim_env.Landmark(m, matrix([0.01, 0.02], dtype=float).getT())


	for t in range(time):

		# motion propagation
 		for mp_iteration in range(sim_env.num_of_m_p):
			robots.prop_update()

		#robot 0
		[dis, phi] = sim_env.relative_measurement(robots.position[0:2], robots.theta[0], landmarks[0].position)
		robots.ablt_obsv(0, [dis, phi], landmarks[0])

		# robot 2
		[dis, phi] = sim_env.relative_measurement(robots.position[4:6], robots.theta[2], robots.position[0:2])
		robots.rela_obsv(2, 0, [dis, phi])

		[dis, phi] = sim_env.relative_measurement(robots.position[4:6], robots.theta[2], robots.position[2:4])
		robots.rela_obsv(2, 1, [dis, phi])

		# observation - robot 3
		[dis, phi] = sim_env.relative_measurement(robots.position[6:8], robots.theta[3], landmarks[0].position)
		robots.ablt_obsv(3, [dis, phi], landmarks[0])

		[dis, phi] = sim_env.relative_measurement(robots.position[6:8], robots.theta[3], robots.position[8:10])
		robots.rela_obsv(3, 4, [dis, phi])





		# real error
		error_arr[t] = error_arr[t] + robots.error() *(1/float(itr))

		# covariance error
		sigma_tr_arr[t] = sigma_tr_arr[t] + math.sqrt(0.2*robots.get_sigma().trace()[0,0] )*(1/float(itr))
		sigma_th_tr_arr[t] = sigma_th_tr_arr[t] + math.sqrt(0.2*robots.get_th_sigma().trace()[0,0]  )*(1/float(itr))


# output

file = open('output_ls_cen.txt', 'w')
for t in range(time):
	file.write( str(sigma_tr_arr[t]) + ' ' + str(sigma_th_tr_arr[t]) + ' ' + str(error_arr[t]) + '\n')
file.close()

