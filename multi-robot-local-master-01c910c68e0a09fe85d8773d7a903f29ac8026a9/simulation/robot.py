from numpy import matrix
from numpy import random
from math import cos, sin, atan2, sqrt


N = 3

J = matrix([[0, -1],[1, 0]])

z_mtx_6 = matrix([[0,0,0,0,0,0], [0,0,0,0,0,0], [0,0,0,0,0,0], [0,0,0,0,0,0], [0,0,0,0,0,0], [0,0,0,0,0,0]], dtype=float)
i_mtx_6 = matrix([[1,0,0,0,0,0], [0,1,0,0,0,0], [0,0,1,0,0,0], [0,0,0,1,0,0], [0,0,0,0,1,0], [0,0,0,0,0,1]], dtype=float)
i_mtx_2 = matrix([[1, 0],[0, 1]], dtype=float)

dt = 1.0

var_u_v = 0.01
var_u_theta = 0.01

var_v = 10.0

var_dis = 0.001
var_phi = 0.001


class Landmark:

	def __init__(self, index, position):
		self.index = index
		self.position = position



class Robot:


	def __init__(self, index , initial_s):
		self.index = index

		self.s = initial_s
		self.sigma = z_mtx_6.copy()

		self.position = [initial_s[2*index,0], initial_s[2*index+1,0]]
		self.theta = 4


	def prop_update(self, input_value):


		v = input_value[0]
		a_v = input_value[1]
		i = 2*self.index

		# estimation update
		self.s[i,0] = self.s[i,0] + cos(self.theta)*v*dt
		self.s[i+1,0] = self.s[i+1,0] + sin(self.theta)*v*dt

		# covariance update
		for j in range(N):
			inx = 2*j

			if j==self.index:
				self.sigma[inx:inx+2, inx:inx+2] = self.sigma[inx:inx+2, inx:inx+2]+ dt*dt*rot_mtx(self.theta)*matrix([[var_u_v, 0],[0, v*v*var_u_theta]])*rot_mtx(self.theta).T

			else:
				self.sigma[inx:inx+2, inx:inx+2] = self.sigma[inx:inx+2, inx:inx+2] + dt*dt*var_v*i_mtx_2.copy()


		# real position update
		v = v + random.normal(0, sqrt(var_u_v))
		self.position[0] = self.position[0] + cos(self.theta)*v*dt
		self.position[1] = self.position[1] + sin(self.theta)*v*dt

		#a_v = a_v + random.normal(0, sqrt(var_u_theta)
		self.theta = self.theta + a_v*dt


	def ablt_obsv(self, obs_value, landmark):
		i = 2*self.index


		H_i = matrix([[0,0,0,0,0,0], [0,0,0,0,0,0]], dtype=float)
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


		self.s = self.s + kalman_gain*(z - hat_z)

		self.sigma = self.sigma - kalman_gain*H*self.sigma


	def rela_obsv(self, obs_idx, obs_value):
		i = 2*self.index
		j = 2*obs_idx


		H_ij = matrix([[0,0,0,0,0,0], [0,0,0,0,0,0]], dtype=float)
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


		self.s = self.s + kalman_gain*(z - hat_z)

		self.sigma = self.sigma - kalman_gain*H*self.sigma


	def comm(self, comm_idx, comm_robot_s, comm_robot_sigma):
		i = 2*self.index
		j = 2*comm_idx

		sigma_invention = self.sigma + comm_robot_sigma
		kalman_gain = self.sigma * sigma_invention.getI()

		self.s = self.s + kalman_gain*(comm_robot_s - self.s)
		self.sigma = self.sigma - kalman_gain*self.sigma



def rot_mtx(theta):
	return matrix([[cos(theta), -sin(theta)], [sin(theta), cos(theta)]])



def relative_measurement(robot_1, robot_2):

	delta_x = robot_2.position[0] - robot_1.position[0]
	delta_y = robot_2.position[1] - robot_1.position[1]
	dis = sqrt(delta_y*delta_y + delta_x*delta_x) + random.normal(0, sqrt(var_dis))
	phi = atan2(delta_y, delta_x) + random.normal(0, sqrt(var_phi)) - robot_1.theta

	return [dis, phi]

