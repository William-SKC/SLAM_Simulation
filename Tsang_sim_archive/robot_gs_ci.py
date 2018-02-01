from numpy import matrix
from numpy import random
from numpy import linalg
from math import cos, sin, atan2, sqrt

from sim_env import *




class Robot_GS_CI:


	def __init__(self, index , initial_s):
		self.index = index

		self.s = initial_s.copy()
		self.sigma = i_mtx_10.copy()

		self.th_sigma = i_mtx_10.copy()

		self.position = [initial_s[2*index,0], initial_s[2*index+1,0]]
		self.theta = 0.0




	def prop_update(self):


		# select valid motion input
		[v, a_v] = [random.uniform(-max_v,max_v), random.uniform(-max_oemga,max_oemga)]
		v_star = v + random.normal(0, sqrt(var_u_v))
		pre_update_position = [self.position[0] + cos(self.theta)*v_star*dt, self.position[1] + sin(self.theta)*v_star*dt]


		while(not inRange(pre_update_position, origin)):

			[v, a_v] = [random.uniform(-max_v,max_v), random.uniform(-max_oemga,max_oemga)]
			v_star = v + random.normal(0, sqrt(var_u_v))
			pre_update_position = [self.position[0] + cos(self.theta)*v_star*dt, self.position[1] + sin(self.theta)*v_star*dt]


		# real position update
		self.position[0] = self.position[0] + cos(self.theta)*v_star*dt
		self.position[1] = self.position[1] + sin(self.theta)*v_star*dt

		self.theta = self.theta + a_v*dt


		i = 2*self.index

		# estimation update
		self.s[i,0] = self.s[i,0] + cos(self.theta)*v*dt
		self.s[i+1,0] = self.s[i+1,0] + sin(self.theta)*v*dt

		# covariance update
		for j in range(N):
			inx = 2*j

			if j==self.index:
				#self.sigma[inx:inx+2, inx:inx+2] = self.sigma[inx:inx+2, inx:inx+2]+ dt*dt*rot_mtx(self.theta)*matrix([[var_u_v, 0],[0, v*v*var_u_theta]])*rot_mtx(self.theta).T
				self.sigma[inx:inx+2, inx:inx+2] = self.sigma[inx:inx+2, inx:inx+2]+ dt*dt*rot_mtx(self.theta)*matrix([[var_u_v, 0],[0, 0]])*rot_mtx(self.theta).T
				self.th_sigma[inx:inx+2, inx:inx+2] = self.th_sigma[inx:inx+2, inx:inx+2]+ dt*dt*matrix([[var_u_v, 0],[0, var_u_v]])

			else:
				self.sigma[inx:inx+2, inx:inx+2] = self.sigma[inx:inx+2, inx:inx+2] + dt*dt*var_v*i_mtx_2.copy()
				self.th_sigma[inx:inx+2, inx:inx+2] = self.th_sigma[inx:inx+2, inx:inx+2]+ dt*dt*var_v*i_mtx_2.copy()





	def ablt_obsv(self, obs_value, landmark):
		i = 2*self.index


		H_i = matrix([[0,0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0,0]], dtype=float)
		H_i[0, i] = -1
		H_i[1, i+1] = -1


		H = rot_mtx(self.theta).getT()*H_i
		
		dis = obs_value[0]
		phi = obs_value[1]

		#z = [dis*cos(phi), dis*sin(phi)]
		hat_z = rot_mtx(self.theta).getT() * (landmark.position + H_i*self.s)
		z = matrix([dis*cos(phi), dis*sin(phi)]).getT()

		sigma_z = rot_mtx(phi) * matrix([[var_dis, 0],[0, dis*dis*var_phi]]) * rot_mtx(phi).getT() 
		sigma_invention = H * self.sigma * H.getT()  + sigma_z
		kalman_gain = self.sigma*H.getT()*sigma_invention.getI()


		sigma_th_z =  matrix([[d_max*d_max*var_phi, 0],[0, d_max*d_max*var_phi]]) 
		sigma_th_invention = H_i * self.th_sigma * H_i.getT()  + sigma_th_z
		kalman_th_gain = self.th_sigma*H_i.getT()*sigma_th_invention.getI()


		self.s = self.s + kalman_gain*(z - hat_z)

		self.sigma = self.sigma - kalman_gain*H*self.sigma

		self.th_sigma = self.th_sigma - kalman_th_gain*H_i*self.th_sigma		


	def rela_obsv(self, obs_idx, obs_value):
		i = 2*self.index
		j = 2*obs_idx


		H_ij = matrix([[0,0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0,0]], dtype=float)
		H_ij[0, i] = -1
		H_ij[1, i+1] = -1
		H_ij[0, j] = 1
		H_ij[1, j+1] = 1


		H = rot_mtx(self.theta).getT()*H_ij

		dis = obs_value[0]
		phi = obs_value[1]

		#z = [dis*cos(phi), dis*sin(phi)]
		hat_z = H * self.s
		z = matrix([dis*cos(phi), dis*sin(phi)]).getT()

		sigma_z = rot_mtx(phi) * matrix([[var_dis, 0],[0, dis*dis*var_phi]]) * rot_mtx(phi).getT() 
		sigma_invention = H * self.sigma * H.getT()  + sigma_z
		kalman_gain = self.sigma*H.getT()*sigma_invention.getI()



		sigma_th_z =  matrix([[d_max*d_max*var_phi, 0],[0, d_max*d_max*var_phi]]) 
		sigma_th_invention = H_ij * self.th_sigma * H_ij.getT()  + sigma_th_z
		kalman_th_gain = self.th_sigma*H_ij.getT()*sigma_th_invention.getI()




		self.s = self.s + kalman_gain*(z - hat_z)

		self.sigma = self.sigma - kalman_gain*H*self.sigma

		self.th_sigma = self.th_sigma - kalman_th_gain*H_ij*self.th_sigma		



	def comm(self, comm_robot_s, comm_robot_sigma, comm_robot_th_sigma):



		#inv_covariance_array = [None]*99

		#for iii in range(99):
		#	e = (iii+1)*0.01
			#inv_covariance_array[iii] = (e*self.sigma.getI() + (1-e)*comm_robot_sigma.getI()).trace()
			#inv_covariance_array[iii] = linalg.det(e*self.sigma.getI() + (1-e)*comm_robot_sigma.getI())



		#iii = inv_covariance_array.index(max(inv_covariance_array))
		e =  0.23 # (iii+1)*0.01



		sig_inv = e*self.sigma.getI() + (1-e)*comm_robot_sigma.getI()
		self.sigma = sig_inv.getI()

		self.s = self.sigma * (e*self.sigma.getI()*self.s + (1-e)*comm_robot_sigma.getI()*comm_robot_s)


		sig_th_inv = e*self.th_sigma.getI() + (1-e)*comm_robot_th_sigma.getI()
		self.th_sigma = sig_th_inv.getI()		



